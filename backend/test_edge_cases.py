import os
import sys
import unittest
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, os.path.abspath("."))
load_dotenv()

from src.services.mastery_service import calculate_sm2, update_concept_mastery, get_mastery_breakdown
from src.services.rag_service import _chunk_text, DocumentChunk, RetrievedChunk, retrieve
from src.services.guardrail_service import _heuristic_evaluate
from src.utils.model_router import health_tracker


class EdgeCaseTestSuite(unittest.TestCase):
    def test_sm2_boundary_qualities(self):
        """Test SM-2 with boundary qualities (0, 1, 2, 3, 4, 5)."""
        for q in range(6):
            rep, ef, interval = calculate_sm2(quality=q, repetition=2, efactor=2.5, interval_days=6)
            self.assertGreaterEqual(ef, 1.3, "EF should never drop below 1.3")
            self.assertGreaterEqual(interval, 1, "Interval should always be >= 1 day")
            if q < 3:
                self.assertEqual(rep, 0, "Repetition should reset on failure (q < 3)")
            else:
                self.assertEqual(rep, 3, "Repetition should increment on success (q >= 3)")

    def test_chunker_empty_and_short(self):
        """Test document chunker with empty, single-line, and whitespace text."""
        empty_chunks = _chunk_text(text="", source_type="pdf")
        self.assertEqual(len(empty_chunks), 0)

        spaces_chunks = _chunk_text(text="   \n\n  \t  ", source_type="pdf")
        self.assertEqual(len(spaces_chunks), 0)

        short_chunks = _chunk_text(text="Hello world! This is a test.", source_type="pdf")
        self.assertEqual(len(short_chunks), 1)
        self.assertIn("Hello world", short_chunks[0].content)

    def test_guardrail_heuristic_boundaries(self):
        """Test guardrail heuristic with empty context, punctuation only, and long inputs."""
        empty_ctx = _heuristic_evaluate("What is gravity?", "", "Gravity is a fundamental interaction.")
        self.assertEqual(empty_ctx.status, "general_knowledge")
        self.assertEqual(empty_ctx.confidence, "medium")

        punct_query = _heuristic_evaluate("??? !!! ...", "Some text here", "Some answer here")
        self.assertTrue(0.0 <= punct_query.overall_trust <= 1.0)

    def test_circuit_breaker_cooldown(self):
        """Test provider health tracker transitions."""
        provider = "test_prov"
        self.assertFalse(health_tracker.is_degraded(provider))
        
        # Record 3 failures
        health_tracker.record_failure(provider)
        health_tracker.record_failure(provider)
        self.assertFalse(health_tracker.is_degraded(provider)) # Not yet 3
        health_tracker.record_failure(provider)
        self.assertTrue(health_tracker.is_degraded(provider)) # Exactly 3 -> degraded
        
        # Record success resets
        health_tracker.record_success(provider)
        self.assertFalse(health_tracker.is_degraded(provider))

    def test_retrieve_empty_query(self):
        """Test retrieve gracefully handles empty query without error."""
        res = retrieve("test_space", "")
        self.assertEqual(res, [])
        res_spaces = retrieve("test_space", "   ")
        self.assertEqual(res_spaces, [])


if __name__ == "__main__":
    unittest.main()
