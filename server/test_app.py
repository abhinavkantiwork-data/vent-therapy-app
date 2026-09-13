import unittest

from app import conversation_memory, detect_crisis, response_style_instruction, therapeutic_approach


class AssistantPolicyTests(unittest.TestCase):
    def test_structure_request_gets_detailed_mode(self):
        instruction = response_style_instruction("Help me organize my thoughts in a table")
        self.assertIn("structured", instruction)
        self.assertIn("Markdown table", instruction)

    def test_simple_check_in_stays_concise(self):
        instruction = response_style_instruction("I feel sad today")
        self.assertIn("concise", instruction)

    def test_approach_matches_panic(self):
        approach = therapeutic_approach("I am panicking and cannot breathe")
        self.assertIn("grounding", approach)

    def test_conversation_memory_uses_recent_user_context(self):
        memory = conversation_memory([
            {"sender": "user", "text": "I have an exam tomorrow"},
            {"sender": "ai", "text": "That sounds stressful"},
            {"sender": "user", "text": "Help me make a plan"},
        ])
        self.assertIn("exam tomorrow", memory)
        self.assertIn("make a plan", memory)

    def test_crisis_matching_avoids_substrings(self):
        self.assertTrue(detect_crisis("I want to die"))
        self.assertFalse(detect_crisis("I am changing my diet"))


if __name__ == "__main__":
    unittest.main()
