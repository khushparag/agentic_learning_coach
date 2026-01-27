"""
Content Generator Service for enriched learning content.

This service generates structured educational content using LLM,
including concept cards, code examples, knowledge checks, and diagrams.
"""

import json
import logging
import uuid
from typing import Any, Dict, List, Optional
from dataclasses import asdict

from src.adapters.services.llm_service import LLMService, create_llm_service, LLMResponse
from src.domain.entities.learning_content import (
    StructuredLesson, ContentSection, ContentSectionType,
    ConceptCard, CodeExample, KnowledgeCheck, KnowledgeCheckType,
    MermaidDiagram, DiagramType, Resource, ResourceCategory, ResourceType,
    LessonMetadata, TextBlock, Analogy, Mistake, UseCase, TestCase, Option,
    ProgrammingLanguage, CodeSnippet
)

logger = logging.getLogger(__name__)


class ContentGeneratorService:
    """
    Generates structured educational content using LLM.
    
    This service creates rich learning content including:
    - Structured lessons with objectives and takeaways
    - Concept cards with multiple explanation styles
    - Interactive code examples with test cases
    - Knowledge checks for comprehension verification
    - Mermaid diagrams for visualization
    """
    
    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or create_llm_service()
    
    async def generate_lesson(
        self,
        topic: str,
        task_title: str,
        skill_level: str,
        technology: Optional[str] = None,
        requirements: Optional[List[str]] = None
    ) -> StructuredLesson:
        """
        Generate a complete structured lesson.
        
        Args:
            topic: The main topic of the lesson
            task_title: Title of the learning task
            skill_level: beginner, intermediate, or advanced
            technology: Programming language/framework context
            requirements: Specific requirements to cover
            
        Returns:
            StructuredLesson with all sections populated
        """
        # Validate and sanitize topic
        topic = topic.strip() if topic else ""
        if not topic:
            logger.warning(f"Empty topic provided, using task_title: {task_title}")
            topic = task_title or "Programming Fundamentals"
        
        logger.info(f"ContentGenerator.generate_lesson called")
        logger.info(f"  Topic: '{topic}'")
        logger.info(f"  Task title: '{task_title}'")
        logger.info(f"  Skill level: {skill_level}")
        logger.info(f"  Technology: {technology}")
        logger.info(f"  Requirements: {requirements}")
        
        requirements = requirements or []
        tech_context = f" using {technology}" if technology else ""
        
        # Generate the main lesson structure
        system_prompt = self._get_lesson_system_prompt(skill_level)
        prompt = self._build_lesson_prompt(topic, task_title, skill_level, tech_context, requirements)
        
        logger.debug(f"Calling LLM service...")
        response = await self.llm_service.generate(prompt, system_prompt)
        logger.info(f"LLM response received - success: {response.success}")
        
        if response.success:
            try:
                logger.debug(f"Parsing LLM response (length: {len(response.content)} chars)")
                lesson_data = self._parse_lesson_response(response.content)
                logger.info(f"Successfully parsed lesson data with {len(lesson_data.get('sections', []))} sections")
                return self._build_structured_lesson(
                    lesson_data, topic, task_title, skill_level, technology, requirements
                )
            except Exception as e:
                logger.error(f"Failed to parse LLM response, using fallback: {e}", exc_info=True)
                logger.debug(f"LLM response content (first 500 chars): {response.content[:500]}...")
                return self._generate_fallback_lesson(topic, task_title, skill_level, technology, requirements)
        else:
            logger.error(f"LLM generation failed: {response.error}")
            return self._generate_fallback_lesson(topic, task_title, skill_level, technology, requirements)

    async def generate_concept_card(
        self,
        concept: str,
        skill_level: str,
        context: str = ""
    ) -> ConceptCard:
        """
        Generate a concept card with multiple explanation styles.
        
        Args:
            concept: The concept to explain
            skill_level: beginner, intermediate, or advanced
            context: Additional context for the explanation
            
        Returns:
            ConceptCard with primary explanation, analogy, mistakes, and use cases
        """
        logger.info(f"Generating concept card for: {concept}")
        
        system_prompt = """You are an expert programming instructor creating concept cards.
Generate educational content that includes:
1. A clear primary explanation (2-3 paragraphs)
2. A real-world analogy with term mappings
3. 2-3 common mistakes with corrections
4. 2-3 practical use cases

Return your response as valid JSON with this structure:
{
    "primary_explanation": "Clear explanation of the concept",
    "analogy": {
        "title": "Analogy title",
        "description": "How the analogy relates to the concept",
        "mapping": {"concept_term": "analogy_term"}
    },
    "common_mistakes": [
        {"description": "What the mistake is", "example": "Bad code", "correction": "Good code"}
    ],
    "when_to_use": [
        {"scenario": "When to use", "example": "Code example", "benefit": "Why it helps"}
    ]
}"""
        
        prompt = f"""Create a concept card for "{concept}" for a {skill_level} programmer.
{f'Context: {context}' if context else ''}

The explanation should be appropriate for {skill_level} level learners."""
        
        response = await self.llm_service.generate(prompt, system_prompt)
        
        if response.success:
            try:
                data = self._parse_json_response(response.content)
                return self._build_concept_card(concept, data)
            except Exception as e:
                logger.warning(f"Failed to parse concept card response: {e}")
                return self._generate_fallback_concept_card(concept, skill_level)
        else:
            return self._generate_fallback_concept_card(concept, skill_level)
    
    async def generate_knowledge_check(
        self,
        concept: str,
        difficulty: int,
        check_type: KnowledgeCheckType = KnowledgeCheckType.MULTIPLE_CHOICE
    ) -> KnowledgeCheck:
        """
        Generate a knowledge check question.
        
        Args:
            concept: The concept to test
            difficulty: 1-5 difficulty level
            check_type: Type of question (multiple-choice, fill-blank, etc.)
            
        Returns:
            KnowledgeCheck with question, options, and feedback
        """
        logger.info(f"Generating knowledge check for: {concept}, type: {check_type.value}")
        
        type_instructions = {
            KnowledgeCheckType.MULTIPLE_CHOICE: "Create a multiple choice question with 4 options",
            KnowledgeCheckType.FILL_BLANK: "Create a fill-in-the-blank question",
            KnowledgeCheckType.CODE_COMPLETION: "Create a code completion question",
            KnowledgeCheckType.TRUE_FALSE: "Create a true/false question"
        }
        
        system_prompt = f"""You are creating a knowledge check question.
{type_instructions.get(check_type, type_instructions[KnowledgeCheckType.MULTIPLE_CHOICE])}

Return your response as valid JSON with this structure:
{{
    "question": "The question text",
    "options": [
        {{"id": "a", "text": "Option text", "is_correct": false, "feedback": "Why wrong/right"}}
    ],
    "correct_answer": "a",
    "explanation": "Full explanation of the correct answer",
    "hint": "A helpful hint without giving away the answer"
}}"""
        
        prompt = f"""Create a difficulty {difficulty}/5 {check_type.value} question about "{concept}".

The question should test understanding, not just memorization."""
        
        response = await self.llm_service.generate(prompt, system_prompt)
        
        if response.success:
            try:
                data = self._parse_json_response(response.content)
                return self._build_knowledge_check(concept, data, check_type, difficulty)
            except Exception as e:
                logger.warning(f"Failed to parse knowledge check response: {e}")
                return self._generate_fallback_knowledge_check(concept, check_type, difficulty)
        else:
            return self._generate_fallback_knowledge_check(concept, check_type, difficulty)
    
    async def generate_code_example(
        self,
        concept: str,
        language: str,
        skill_level: str
    ) -> CodeExample:
        """
        Generate an interactive code example.
        
        Args:
            concept: The concept to demonstrate
            language: Programming language
            skill_level: beginner, intermediate, or advanced
            
        Returns:
            CodeExample with starter code, solution, and test cases
        """
        logger.info(f"Generating code example for: {concept} in {language}")
        
        system_prompt = f"""You are creating an interactive code example for {skill_level} learners.
Generate a practical coding exercise that demonstrates the concept.

Return your response as valid JSON with this structure:
{{
    "title": "Example title",
    "description": "What this example demonstrates",
    "starter_code": "// Code template with TODO comments",
    "solution_code": "// Complete working solution",
    "test_cases": [
        {{"input": "test input", "expected_output": "expected result", "description": "What this tests"}}
    ],
    "hints": ["Hint 1", "Hint 2"],
    "expected_output": "What the output should look like"
}}"""
        
        prompt = f"""Create a {skill_level}-level code example demonstrating "{concept}" in {language}.

The example should:
1. Be practical and realistic
2. Include 2-3 test cases
3. Have progressive hints
4. Be completable in 5-10 minutes"""
        
        response = await self.llm_service.generate(prompt, system_prompt)
        
        if response.success:
            try:
                data = self._parse_json_response(response.content)
                return self._build_code_example(concept, language, data)
            except Exception as e:
                logger.warning(f"Failed to parse code example response: {e}")
                return self._generate_fallback_code_example(concept, language)
        else:
            return self._generate_fallback_code_example(concept, language)
    
    async def get_alternative_explanation(
        self,
        concept: str,
        previous_explanations: List[str]
    ) -> str:
        """
        Generate an alternative explanation for a concept.
        
        Args:
            concept: The concept to explain differently
            previous_explanations: List of explanations already provided
            
        Returns:
            A new, different explanation
        """
        logger.info(f"Generating alternative explanation for: {concept}")
        
        previous_text = "\n".join(f"- {exp[:200]}..." for exp in previous_explanations)
        
        system_prompt = """You are an expert at explaining programming concepts in different ways.
Generate a completely different explanation that uses a new approach, analogy, or perspective.
The explanation should be clear and educational."""
        
        prompt = f"""Explain "{concept}" in a completely different way than these previous explanations:

{previous_text}

Provide a fresh perspective that might help someone who didn't understand the previous explanations."""
        
        response = await self.llm_service.generate(prompt, system_prompt)
        
        if response.success:
            return response.content
        else:
            return f"Let me try explaining {concept} differently: Think of it as a fundamental building block that helps organize and structure your code in a more maintainable way."

    # =========================================================================
    # Private helper methods
    # =========================================================================
    
    def _get_lesson_system_prompt(self, skill_level: str) -> str:
        """Get the system prompt for lesson generation."""
        level_guidance = {
            "beginner": "Use simple language, more analogies, and step-by-step explanations.",
            "intermediate": "Balance theory with practical examples, introduce best practices.",
            "advanced": "Focus on nuances, edge cases, performance considerations, and advanced patterns."
        }
        
        return f"""You are an expert programming instructor creating structured educational content.
{level_guidance.get(skill_level, level_guidance['intermediate'])}

Generate a complete lesson with:
1. Clear learning objectives (3-5 items)
2. Multiple content sections with different types
3. Key takeaways at the end

Return your response as valid JSON with this structure:
{{
    "objectives": ["Objective 1", "Objective 2"],
    "sections": [
        {{
            "type": "text",
            "title": "Section title",
            "content": "Markdown content"
        }},
        {{
            "type": "concept-card",
            "concept_name": "Concept name",
            "primary_explanation": "Explanation",
            "analogy": {{"title": "Title", "description": "Description", "mapping": {{}}}},
            "common_mistakes": [],
            "when_to_use": []
        }},
        {{
            "type": "code-example",
            "title": "Example title",
            "description": "Description",
            "starter_code": "code",
            "solution_code": "code",
            "test_cases": [],
            "hints": []
        }},
        {{
            "type": "knowledge-check",
            "question": "Question",
            "options": [{{"id": "a", "text": "Option", "is_correct": true, "feedback": "Feedback"}}],
            "correct_answer": "a",
            "explanation": "Explanation",
            "hint": "Hint"
        }}
    ],
    "key_takeaways": ["Takeaway 1", "Takeaway 2"]
}}"""
    
    def _build_lesson_prompt(
        self,
        topic: str,
        task_title: str,
        skill_level: str,
        tech_context: str,
        requirements: List[str]
    ) -> str:
        """Build the prompt for lesson generation."""
        requirements_text = ""
        if requirements:
            requirements_text = "\n\nKey topics to cover:\n" + "\n".join(f"- {req}" for req in requirements)
        
        return f"""Create a comprehensive lesson for:

Title: {task_title}
Topic: {topic}{tech_context}
Skill Level: {skill_level}
{requirements_text}

The lesson should include:
1. 3-5 learning objectives
2. At least one concept card explaining a key concept
3. At least one interactive code example
4. At least one knowledge check question
5. 3-5 key takeaways

Ensure content is appropriate for {skill_level} learners."""
    
    def _parse_json_response(self, content: str) -> Dict[str, Any]:
        """Parse JSON from LLM response, handling markdown code blocks."""
        # Handle markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        return json.loads(content.strip())
    
    def _parse_lesson_response(self, content: str) -> Dict[str, Any]:
        """Parse the lesson response from LLM."""
        return self._parse_json_response(content)
    
    def _build_structured_lesson(
        self,
        data: Dict[str, Any],
        topic: str,
        task_title: str,
        skill_level: str,
        technology: Optional[str],
        requirements: List[str]
    ) -> StructuredLesson:
        """Build a StructuredLesson from parsed data."""
        lesson_id = str(uuid.uuid4())
        
        # Build sections
        sections = []
        for i, section_data in enumerate(data.get("sections", [])):
            section = self._build_section(section_data, i, technology or "javascript")
            if section:
                sections.append(section)
        
        # Ensure we have at least some content
        if not sections:
            sections = self._generate_default_sections(topic, skill_level, technology)
        
        # Build metadata
        metadata = LessonMetadata(
            estimated_minutes=max(10, len(sections) * 5),
            difficulty=skill_level,
            prerequisites=requirements[:3] if requirements else [],
            technology=technology or "",
            last_updated=""
        )
        
        return StructuredLesson(
            id=lesson_id,
            title=task_title,
            topic=topic,
            metadata=metadata,
            objectives=data.get("objectives", [f"Understand {topic}"]),
            sections=sections,
            key_takeaways=data.get("key_takeaways", [f"You learned about {topic}"]),
            related_resources=[],
            version="1.0.0"
        )
    
    def _build_section(
        self,
        data: Dict[str, Any],
        order: int,
        language: str
    ) -> Optional[ContentSection]:
        """Build a ContentSection from parsed data."""
        section_type = data.get("type", "text")
        section_id = str(uuid.uuid4())
        
        try:
            if section_type == "text":
                content = TextBlock(
                    content=data.get("content", data.get("title", "")),
                    format="markdown"
                )
                return ContentSection(
                    id=section_id,
                    type=ContentSectionType.TEXT,
                    order=order,
                    content=content,
                    completion_required=False
                )
            
            elif section_type == "concept-card":
                content = self._build_concept_card_from_data(data)
                return ContentSection(
                    id=section_id,
                    type=ContentSectionType.CONCEPT_CARD,
                    order=order,
                    content=content,
                    completion_required=True
                )
            
            elif section_type == "code-example":
                content = self._build_code_example_from_data(data, language)
                return ContentSection(
                    id=section_id,
                    type=ContentSectionType.CODE_EXAMPLE,
                    order=order,
                    content=content,
                    completion_required=True
                )
            
            elif section_type == "knowledge-check":
                content = self._build_knowledge_check_from_data(data)
                return ContentSection(
                    id=section_id,
                    type=ContentSectionType.KNOWLEDGE_CHECK,
                    order=order,
                    content=content,
                    completion_required=True
                )
            
            elif section_type == "diagram":
                content = self._build_diagram_from_data(data)
                return ContentSection(
                    id=section_id,
                    type=ContentSectionType.DIAGRAM,
                    order=order,
                    content=content,
                    completion_required=False
                )
            
            else:
                logger.warning(f"Unknown section type: {section_type}")
                return None
                
        except Exception as e:
            logger.warning(f"Failed to build section: {e}")
            return None

    def _build_concept_card_from_data(self, data: Dict[str, Any]) -> ConceptCard:
        """Build a ConceptCard from parsed data."""
        analogy_data = data.get("analogy", {})
        analogy = Analogy(
            title=analogy_data.get("title", "Real-world analogy"),
            description=analogy_data.get("description", ""),
            mapping=analogy_data.get("mapping", {})
        )
        
        mistakes = [
            Mistake(
                description=m.get("description", ""),
                example=m.get("example", ""),
                correction=m.get("correction", "")
            )
            for m in data.get("common_mistakes", [])
        ]
        
        use_cases = [
            UseCase(
                scenario=u.get("scenario", ""),
                example=u.get("example", ""),
                benefit=u.get("benefit", "")
            )
            for u in data.get("when_to_use", [])
        ]
        
        return ConceptCard(
            id=str(uuid.uuid4()),
            concept_name=data.get("concept_name", "Concept"),
            primary_explanation=data.get("primary_explanation", ""),
            analogy=analogy,
            alternative_explanations=data.get("alternative_explanations", []),
            common_mistakes=mistakes,
            when_to_use=use_cases
        )
    
    def _build_code_example_from_data(self, data: Dict[str, Any], language: str) -> CodeExample:
        """Build a CodeExample from parsed data."""
        # Map language string to enum
        lang_map = {
            "javascript": ProgrammingLanguage.JAVASCRIPT,
            "typescript": ProgrammingLanguage.TYPESCRIPT,
            "python": ProgrammingLanguage.PYTHON,
            "java": ProgrammingLanguage.JAVA
        }
        prog_lang = lang_map.get(language.lower(), ProgrammingLanguage.JAVASCRIPT)
        
        test_cases = [
            TestCase(
                input=t.get("input", ""),
                expected_output=t.get("expected_output", ""),
                description=t.get("description", "")
            )
            for t in data.get("test_cases", [])
        ]
        
        return CodeExample(
            id=str(uuid.uuid4()),
            title=data.get("title", "Code Example"),
            description=data.get("description", ""),
            language=prog_lang,
            starter_code=data.get("starter_code", "// Your code here"),
            solution_code=data.get("solution_code", ""),
            test_cases=test_cases,
            hints=data.get("hints", []),
            is_editable=True,
            expected_output=data.get("expected_output")
        )
    
    def _build_knowledge_check_from_data(self, data: Dict[str, Any]) -> KnowledgeCheck:
        """Build a KnowledgeCheck from parsed data."""
        options = [
            Option(
                id=o.get("id", str(i)),
                text=o.get("text", ""),
                is_correct=o.get("is_correct", False),
                feedback=o.get("feedback", "")
            )
            for i, o in enumerate(data.get("options", []))
        ]
        
        return KnowledgeCheck(
            id=str(uuid.uuid4()),
            question=data.get("question", ""),
            type=KnowledgeCheckType.MULTIPLE_CHOICE,
            options=options,
            correct_answer=data.get("correct_answer", ""),
            explanation=data.get("explanation", ""),
            hint=data.get("hint", ""),
            difficulty=data.get("difficulty", 2)
        )
    
    def _build_diagram_from_data(self, data: Dict[str, Any]) -> MermaidDiagram:
        """Build a MermaidDiagram from parsed data."""
        type_map = {
            "flowchart": DiagramType.FLOWCHART,
            "sequence": DiagramType.SEQUENCE,
            "class": DiagramType.CLASS,
            "state": DiagramType.STATE,
            "er": DiagramType.ER
        }
        
        return MermaidDiagram(
            type=type_map.get(data.get("diagram_type", "flowchart"), DiagramType.FLOWCHART),
            code=data.get("code", ""),
            caption=data.get("caption", ""),
            alt_text=data.get("alt_text", "Diagram visualization")
        )
    
    def _build_concept_card(self, concept: str, data: Dict[str, Any]) -> ConceptCard:
        """Build a ConceptCard from API response data."""
        analogy_data = data.get("analogy", {})
        analogy = Analogy(
            title=analogy_data.get("title", "Real-world analogy"),
            description=analogy_data.get("description", ""),
            mapping=analogy_data.get("mapping", {})
        )
        
        mistakes = [
            Mistake(
                description=m.get("description", ""),
                example=m.get("example", ""),
                correction=m.get("correction", "")
            )
            for m in data.get("common_mistakes", [])
        ]
        
        use_cases = [
            UseCase(
                scenario=u.get("scenario", ""),
                example=u.get("example", ""),
                benefit=u.get("benefit", "")
            )
            for u in data.get("when_to_use", [])
        ]
        
        return ConceptCard(
            id=str(uuid.uuid4()),
            concept_name=concept,
            primary_explanation=data.get("primary_explanation", ""),
            analogy=analogy,
            alternative_explanations=[],
            common_mistakes=mistakes,
            when_to_use=use_cases
        )
    
    def _build_knowledge_check(
        self,
        concept: str,
        data: Dict[str, Any],
        check_type: KnowledgeCheckType,
        difficulty: int
    ) -> KnowledgeCheck:
        """Build a KnowledgeCheck from API response data."""
        options = [
            Option(
                id=o.get("id", str(i)),
                text=o.get("text", ""),
                is_correct=o.get("is_correct", False),
                feedback=o.get("feedback", "")
            )
            for i, o in enumerate(data.get("options", []))
        ]
        
        return KnowledgeCheck(
            id=str(uuid.uuid4()),
            question=data.get("question", ""),
            type=check_type,
            options=options,
            correct_answer=data.get("correct_answer", ""),
            explanation=data.get("explanation", ""),
            hint=data.get("hint", ""),
            related_concept_id=None,
            difficulty=difficulty
        )
    
    def _build_code_example(
        self,
        concept: str,
        language: str,
        data: Dict[str, Any]
    ) -> CodeExample:
        """Build a CodeExample from API response data."""
        lang_map = {
            "javascript": ProgrammingLanguage.JAVASCRIPT,
            "typescript": ProgrammingLanguage.TYPESCRIPT,
            "python": ProgrammingLanguage.PYTHON,
            "java": ProgrammingLanguage.JAVA
        }
        prog_lang = lang_map.get(language.lower(), ProgrammingLanguage.JAVASCRIPT)
        
        test_cases = [
            TestCase(
                input=t.get("input", ""),
                expected_output=t.get("expected_output", ""),
                description=t.get("description", "")
            )
            for t in data.get("test_cases", [])
        ]
        
        return CodeExample(
            id=str(uuid.uuid4()),
            title=data.get("title", f"{concept} Example"),
            description=data.get("description", ""),
            language=prog_lang,
            starter_code=data.get("starter_code", "// Your code here"),
            solution_code=data.get("solution_code", ""),
            test_cases=test_cases,
            hints=data.get("hints", []),
            is_editable=True,
            expected_output=data.get("expected_output")
        )

    # =========================================================================
    # Fallback generators for when LLM fails
    # =========================================================================
    
    # Topic-specific content templates for common programming concepts
    TOPIC_TEMPLATES = {
        "variables": {
            "objectives": [
                "Understand what variables are and why they're essential",
                "Learn how to declare and initialize variables",
                "Distinguish between different variable types",
                "Apply naming conventions and best practices"
            ],
            "explanation": """Variables are containers that store data values in your program. Think of them as labeled boxes where you can put information and retrieve it later.

Every variable has three key aspects:
1. **Name**: A unique identifier you use to reference the variable
2. **Type**: The kind of data it can hold (numbers, text, etc.)
3. **Value**: The actual data stored in the variable

Variables are fundamental because they allow your program to remember and manipulate data. Without variables, programs couldn't store user input, track scores, or perform calculations.""",
            "analogy": {
                "title": "Labeled Storage Boxes",
                "description": "Variables are like labeled boxes in a warehouse. Each box has a label (variable name), can hold a specific type of item (data type), and contains something inside (value). You can look at what's in a box, replace its contents, or use what's inside.",
                "mapping": {"variable name": "box label", "data type": "box size/type", "value": "contents", "assignment": "putting something in the box"}
            },
            "mistakes": [
                {"description": "Using undeclared variables", "example": "console.log(myVar); // ReferenceError", "correction": "let myVar = 'hello'; console.log(myVar);"},
                {"description": "Confusing = (assignment) with == (comparison)", "example": "if (x = 5) // Always true!", "correction": "if (x == 5) // Correct comparison"},
                {"description": "Not initializing variables before use", "example": "let total; total += 5; // NaN", "correction": "let total = 0; total += 5; // 5"}
            ],
            "use_cases": [
                {"scenario": "Storing user input", "example": "let userName = prompt('Enter name');", "benefit": "Allows personalized responses"},
                {"scenario": "Tracking state", "example": "let isLoggedIn = false;", "benefit": "Controls program flow"},
                {"scenario": "Accumulating values", "example": "let sum = 0; sum += newValue;", "benefit": "Enables calculations"}
            ],
            "takeaways": [
                "Variables store data that your program can use and modify",
                "Choose descriptive names that explain the variable's purpose",
                "Initialize variables before using them to avoid errors",
                "Use const for values that won't change, let for values that will"
            ]
        },
        "functions": {
            "objectives": [
                "Understand what functions are and their purpose",
                "Learn to define and call functions",
                "Work with parameters and return values",
                "Apply the DRY principle using functions"
            ],
            "explanation": """Functions are reusable blocks of code that perform a specific task. They help you organize code, avoid repetition, and make programs easier to understand and maintain.

A function typically has:
1. **Name**: Describes what the function does
2. **Parameters**: Input values the function works with
3. **Body**: The code that runs when the function is called
4. **Return value**: The output the function produces

Functions are the building blocks of modular programming. They let you break complex problems into smaller, manageable pieces.""",
            "analogy": {
                "title": "Recipe Cards",
                "description": "Functions are like recipe cards in a kitchen. Each recipe has a name, lists ingredients needed (parameters), contains step-by-step instructions (function body), and produces a dish (return value). You can use the same recipe multiple times with different ingredients.",
                "mapping": {"function name": "recipe name", "parameters": "ingredients", "function body": "cooking steps", "return value": "finished dish", "calling a function": "following the recipe"}
            },
            "mistakes": [
                {"description": "Forgetting to return a value", "example": "function add(a, b) { a + b; } // Returns undefined", "correction": "function add(a, b) { return a + b; }"},
                {"description": "Not calling the function", "example": "function greet() { console.log('Hi'); } greet; // Nothing happens", "correction": "greet(); // Outputs 'Hi'"},
                {"description": "Modifying global variables inside functions", "example": "let count = 0; function inc() { count++; }", "correction": "function inc(count) { return count + 1; }"}
            ],
            "use_cases": [
                {"scenario": "Reusing code logic", "example": "function calculateTax(amount) { return amount * 0.1; }", "benefit": "Write once, use everywhere"},
                {"scenario": "Organizing complex operations", "example": "function processOrder(order) { validate(order); charge(order); ship(order); }", "benefit": "Clear, readable code"},
                {"scenario": "Handling events", "example": "button.onclick = function() { alert('Clicked!'); };", "benefit": "Responds to user actions"}
            ],
            "takeaways": [
                "Functions encapsulate reusable logic",
                "Use descriptive names that indicate what the function does",
                "Keep functions focused on a single task",
                "Return values make functions more flexible and testable"
            ]
        },
        "loops": {
            "objectives": [
                "Understand the purpose of loops in programming",
                "Learn different types of loops (for, while, do-while)",
                "Know when to use each loop type",
                "Avoid common loop pitfalls like infinite loops"
            ],
            "explanation": """Loops allow you to execute a block of code repeatedly. Instead of writing the same code multiple times, you can use a loop to automate repetition.

There are three main types of loops:
1. **for loop**: Best when you know how many times to iterate
2. **while loop**: Best when you don't know the iteration count in advance
3. **do-while loop**: Like while, but always runs at least once

Loops are essential for processing collections of data, repeating actions until a condition is met, and automating repetitive tasks.""",
            "analogy": {
                "title": "Assembly Line",
                "description": "Loops are like an assembly line in a factory. The same set of operations is performed on each item that comes through. The line keeps running until all items are processed or someone stops it.",
                "mapping": {"loop iteration": "one item processed", "loop condition": "items remaining", "loop body": "assembly steps", "break statement": "emergency stop"}
            },
            "mistakes": [
                {"description": "Creating infinite loops", "example": "while (true) { console.log('Forever'); }", "correction": "while (condition) { /* update condition */ }"},
                {"description": "Off-by-one errors", "example": "for (let i = 0; i <= arr.length; i++) // Goes one too far", "correction": "for (let i = 0; i < arr.length; i++)"},
                {"description": "Modifying array while iterating", "example": "for (let i = 0; i < arr.length; i++) { arr.splice(i, 1); }", "correction": "Use filter() or iterate backwards"}
            ],
            "use_cases": [
                {"scenario": "Processing array elements", "example": "for (let item of items) { process(item); }", "benefit": "Handle each element systematically"},
                {"scenario": "Waiting for user input", "example": "while (!validInput) { input = prompt('Try again'); }", "benefit": "Repeat until success"},
                {"scenario": "Generating sequences", "example": "for (let i = 1; i <= 10; i++) { console.log(i); }", "benefit": "Create patterns or series"}
            ],
            "takeaways": [
                "Loops automate repetitive tasks",
                "Choose the right loop type for your situation",
                "Always ensure your loop has an exit condition",
                "Consider using array methods like map() and forEach() for cleaner code"
            ]
        },
        "arrays": {
            "objectives": [
                "Understand what arrays are and when to use them",
                "Learn to create, access, and modify arrays",
                "Master common array methods",
                "Work with array iteration patterns"
            ],
            "explanation": """Arrays are ordered collections that store multiple values in a single variable. Each value has an index (position) starting from 0.

Key array concepts:
1. **Index**: Position of an element (starts at 0)
2. **Length**: Number of elements in the array
3. **Methods**: Built-in functions like push(), pop(), map(), filter()

Arrays are perfect for storing lists of related items: user names, product prices, test scores, or any collection of similar data.""",
            "analogy": {
                "title": "Numbered Lockers",
                "description": "An array is like a row of numbered lockers. Each locker has a number (index), can hold one item (element), and you can access any locker directly if you know its number. You can add lockers to the end or remove them.",
                "mapping": {"index": "locker number", "element": "locker contents", "length": "total lockers", "push()": "add new locker at end"}
            },
            "mistakes": [
                {"description": "Accessing index out of bounds", "example": "let arr = [1, 2, 3]; console.log(arr[5]); // undefined", "correction": "Check arr.length before accessing"},
                {"description": "Confusing index with value", "example": "let arr = [10, 20, 30]; // arr[1] is 20, not 10", "correction": "Remember: indexes start at 0"},
                {"description": "Using = instead of methods to add elements", "example": "arr = arr + newItem; // Creates string!", "correction": "arr.push(newItem); // Correct way"}
            ],
            "use_cases": [
                {"scenario": "Storing a list of items", "example": "let fruits = ['apple', 'banana', 'orange'];", "benefit": "Organized data storage"},
                {"scenario": "Transforming data", "example": "let doubled = numbers.map(n => n * 2);", "benefit": "Process all elements easily"},
                {"scenario": "Filtering data", "example": "let adults = users.filter(u => u.age >= 18);", "benefit": "Extract matching items"}
            ],
            "takeaways": [
                "Arrays store ordered collections of data",
                "Array indexes start at 0, not 1",
                "Use array methods for cleaner, more readable code",
                "Arrays can hold any type of data, including other arrays"
            ]
        },
        "objects": {
            "objectives": [
                "Understand what objects are and their structure",
                "Learn to create and access object properties",
                "Work with object methods",
                "Use objects to model real-world entities"
            ],
            "explanation": """Objects are collections of related data and functionality. They store data as key-value pairs called properties, and can include functions called methods.

Object structure:
1. **Properties**: Named values (key: value pairs)
2. **Methods**: Functions attached to the object
3. **this keyword**: Refers to the current object

Objects are ideal for representing real-world things like users, products, or any entity with multiple attributes.""",
            "analogy": {
                "title": "ID Card",
                "description": "An object is like an ID card. It has labeled fields (properties) like name, age, and photo. Each field has a value. The card represents a person (entity) with all their relevant information in one place.",
                "mapping": {"property name": "field label", "property value": "field content", "object": "the card itself", "method": "actions the person can do"}
            },
            "mistakes": [
                {"description": "Accessing non-existent properties", "example": "user.nmae // Typo returns undefined", "correction": "Use optional chaining: user?.name"},
                {"description": "Confusing dot and bracket notation", "example": "obj.my-prop // Syntax error", "correction": "obj['my-prop'] // For special characters"},
                {"description": "Mutating objects unintentionally", "example": "const user = {name: 'Jo'}; user.name = 'Sam'; // Allowed!", "correction": "Use Object.freeze() for immutability"}
            ],
            "use_cases": [
                {"scenario": "Representing entities", "example": "let user = { name: 'Alice', age: 25, email: 'alice@example.com' };", "benefit": "Group related data"},
                {"scenario": "Configuration settings", "example": "let config = { theme: 'dark', language: 'en' };", "benefit": "Organized settings"},
                {"scenario": "API responses", "example": "let response = { status: 200, data: [...] };", "benefit": "Structured data exchange"}
            ],
            "takeaways": [
                "Objects group related data and behavior together",
                "Access properties with dot notation or brackets",
                "Objects can be nested to represent complex structures",
                "Use objects to model real-world entities in your code"
            ]
        },
        "conditionals": {
            "objectives": [
                "Understand how conditional statements control program flow",
                "Learn if, else if, and else syntax",
                "Use comparison and logical operators",
                "Apply conditionals to make decisions in code"
            ],
            "explanation": """Conditionals allow your program to make decisions based on conditions. They execute different code blocks depending on whether conditions are true or false.

Types of conditionals:
1. **if**: Executes code if condition is true
2. **else if**: Checks another condition if previous was false
3. **else**: Executes if all conditions are false
4. **switch**: Compares a value against multiple cases

Conditionals are essential for creating interactive, responsive programs that adapt to different situations.""",
            "analogy": {
                "title": "Traffic Light",
                "description": "Conditionals are like traffic lights. Based on the current state (red, yellow, green), different actions are taken. If red, stop. Else if yellow, slow down. Else (green), go. The program checks conditions and responds accordingly.",
                "mapping": {"condition": "light color", "if block": "stop action", "else block": "go action", "else if": "slow down action"}
            },
            "mistakes": [
                {"description": "Using = instead of == or ===", "example": "if (x = 5) // Assignment, always true!", "correction": "if (x === 5) // Comparison"},
                {"description": "Forgetting curly braces", "example": "if (x > 0) console.log('a'); console.log('b'); // 'b' always runs", "correction": "if (x > 0) { console.log('a'); console.log('b'); }"},
                {"description": "Not handling all cases", "example": "if (age >= 18) { /* adult */ } // What about minors?", "correction": "Add else block for other cases"}
            ],
            "use_cases": [
                {"scenario": "User authentication", "example": "if (password === correctPassword) { login(); } else { showError(); }", "benefit": "Security control"},
                {"scenario": "Form validation", "example": "if (email.includes('@')) { submit(); }", "benefit": "Data quality"},
                {"scenario": "Feature flags", "example": "if (featureEnabled) { showNewUI(); }", "benefit": "Controlled rollouts"}
            ],
            "takeaways": [
                "Conditionals let your program make decisions",
                "Use === for strict equality comparison",
                "Always consider the else case",
                "Keep conditions simple and readable"
            ]
        },
        "async": {
            "objectives": [
                "Understand asynchronous programming concepts",
                "Learn about callbacks, promises, and async/await",
                "Handle asynchronous errors properly",
                "Avoid common async pitfalls"
            ],
            "explanation": """Asynchronous programming allows your code to start an operation and continue running while waiting for it to complete. This is essential for operations like API calls, file reading, or timers.

Key async patterns:
1. **Callbacks**: Functions passed to run after an operation completes
2. **Promises**: Objects representing eventual completion or failure
3. **async/await**: Syntactic sugar making async code look synchronous

Async programming prevents your application from freezing while waiting for slow operations.""",
            "analogy": {
                "title": "Restaurant Order",
                "description": "Async programming is like ordering at a restaurant. You place your order (start async operation), get a ticket number (promise), and can do other things while waiting. When your food is ready (operation completes), you're notified and can pick it up (handle the result).",
                "mapping": {"async operation": "placing order", "promise": "order ticket", "await": "waiting for food", "callback": "being called when ready"}
            },
            "mistakes": [
                {"description": "Forgetting await keyword", "example": "const data = fetchData(); // Returns Promise, not data!", "correction": "const data = await fetchData();"},
                {"description": "Not handling errors", "example": "await riskyOperation(); // Unhandled rejection", "correction": "try { await riskyOperation(); } catch (e) { handleError(e); }"},
                {"description": "Callback hell", "example": "getData(d => process(d, r => save(r, () => done())))", "correction": "Use async/await for cleaner code"}
            ],
            "use_cases": [
                {"scenario": "API requests", "example": "const response = await fetch('/api/users');", "benefit": "Non-blocking data fetching"},
                {"scenario": "File operations", "example": "const content = await fs.readFile('data.txt');", "benefit": "Efficient I/O"},
                {"scenario": "Timers and delays", "example": "await new Promise(r => setTimeout(r, 1000));", "benefit": "Controlled timing"}
            ],
            "takeaways": [
                "Async operations don't block the main thread",
                "Always handle both success and error cases",
                "Prefer async/await over callbacks for readability",
                "Use Promise.all() for parallel async operations"
            ]
        },
        "classes": {
            "objectives": [
                "Understand object-oriented programming basics",
                "Learn to define and instantiate classes",
                "Work with constructors, properties, and methods",
                "Apply inheritance and encapsulation"
            ],
            "explanation": """Classes are blueprints for creating objects. They define the structure (properties) and behavior (methods) that objects of that type will have.

Class components:
1. **Constructor**: Special method that initializes new objects
2. **Properties**: Data stored in each instance
3. **Methods**: Functions that operate on the object's data
4. **Inheritance**: Creating new classes based on existing ones

Classes help organize code and model real-world entities with their attributes and behaviors.""",
            "analogy": {
                "title": "Cookie Cutter",
                "description": "A class is like a cookie cutter. The cutter (class) defines the shape, but each cookie (instance) is a separate object. You can make many cookies from one cutter, and each cookie can have different decorations (property values) while sharing the same shape.",
                "mapping": {"class": "cookie cutter", "instance": "individual cookie", "constructor": "cutting process", "properties": "decorations"}
            },
            "mistakes": [
                {"description": "Forgetting 'new' keyword", "example": "const user = User('Alice'); // Error or wrong behavior", "correction": "const user = new User('Alice');"},
                {"description": "Not using 'this' in methods", "example": "getName() { return name; } // undefined", "correction": "getName() { return this.name; }"},
                {"description": "Overusing inheritance", "example": "class Dog extends Animal extends Mammal...", "correction": "Prefer composition over deep inheritance"}
            ],
            "use_cases": [
                {"scenario": "Data models", "example": "class User { constructor(name, email) { this.name = name; this.email = email; } }", "benefit": "Consistent object structure"},
                {"scenario": "UI components", "example": "class Button { render() { /* ... */ } onClick() { /* ... */ } }", "benefit": "Encapsulated behavior"},
                {"scenario": "Services", "example": "class ApiService { async fetch(url) { /* ... */ } }", "benefit": "Reusable functionality"}
            ],
            "takeaways": [
                "Classes are blueprints for creating objects",
                "Use constructors to initialize object state",
                "Methods define what objects can do",
                "Inheritance allows code reuse but use it judiciously"
            ]
        }
    }
    
    def _get_topic_template(self, topic: str) -> Optional[Dict[str, Any]]:
        """Get a topic-specific template if available."""
        topic_lower = topic.lower()
        
        # Direct match
        if topic_lower in self.TOPIC_TEMPLATES:
            return self.TOPIC_TEMPLATES[topic_lower]
        
        # Partial match
        for key, template in self.TOPIC_TEMPLATES.items():
            if key in topic_lower or topic_lower in key:
                return template
        
        # Keyword matching
        keyword_map = {
            "variables": ["var", "let", "const", "declaration", "assignment"],
            "functions": ["function", "method", "callback", "arrow", "lambda"],
            "loops": ["loop", "for", "while", "iteration", "iterate", "repeat"],
            "arrays": ["array", "list", "collection", "map", "filter", "reduce"],
            "objects": ["object", "property", "key", "value", "json"],
            "conditionals": ["if", "else", "switch", "condition", "boolean", "comparison"],
            "async": ["async", "await", "promise", "callback", "asynchronous", "fetch"],
            "classes": ["class", "constructor", "inheritance", "oop", "object-oriented"]
        }
        
        for key, keywords in keyword_map.items():
            if any(kw in topic_lower for kw in keywords):
                return self.TOPIC_TEMPLATES.get(key)
        
        return None
    
    def _generate_fallback_lesson(
        self,
        topic: str,
        task_title: str,
        skill_level: str,
        technology: Optional[str],
        requirements: List[str]
    ) -> StructuredLesson:
        """Generate a fallback lesson when LLM is unavailable."""
        lesson_id = str(uuid.uuid4())
        tech = technology or "programming"
        
        # Try to get topic-specific template
        template = self._get_topic_template(topic)
        
        # Create sections using template if available
        sections = self._generate_default_sections(topic, skill_level, technology, template)
        
        # Use template objectives and takeaways if available
        if template:
            objectives = template.get("objectives", [])
            takeaways = template.get("takeaways", [])
        else:
            objectives = [
                f"Understand the fundamentals of {topic}",
                f"Apply {topic} concepts in practical scenarios",
                f"Recognize common patterns and best practices",
                f"Write clean, maintainable code using {topic}"
            ]
            takeaways = [
                f"{topic} is a fundamental concept in {tech}",
                "Practice with real examples to build understanding",
                "Start simple and gradually increase complexity",
                "Review and refactor your code regularly"
            ]
        
        metadata = LessonMetadata(
            estimated_minutes=20,
            difficulty=skill_level,
            prerequisites=requirements[:3] if requirements else [],
            technology=tech,
            last_updated=""
        )
        
        return StructuredLesson(
            id=lesson_id,
            title=task_title,
            topic=topic,
            metadata=metadata,
            objectives=objectives,
            sections=sections,
            key_takeaways=takeaways,
            related_resources=[],
            version="1.0.0"
        )
    
    def _generate_default_sections(
        self,
        topic: str,
        skill_level: str,
        technology: Optional[str],
        template: Optional[Dict[str, Any]] = None
    ) -> List[ContentSection]:
        """Generate default sections for a lesson."""
        tech = technology or "programming"
        sections = []
        
        # Get template-specific content or use generic
        if template:
            explanation = template.get("explanation", "")
            intro_content = f"""## Introduction to {topic}

{explanation}

Let's explore this concept step by step with examples and practice exercises."""
        else:
            intro_content = f"""## Introduction to {topic}

This lesson will help you understand {topic} and how to apply it in your {tech} projects.

{topic} is an important concept that you'll use frequently as a developer. Understanding it well will help you write cleaner, more efficient code.

Let's explore what it means and how to use it effectively."""
        
        # Introduction text section
        intro_text = TextBlock(
            content=intro_content,
            format="markdown"
        )
        sections.append(ContentSection(
            id=str(uuid.uuid4()),
            type=ContentSectionType.TEXT,
            order=0,
            content=intro_text,
            completion_required=False
        ))
        
        # Concept card
        concept_card = self._generate_fallback_concept_card(topic, skill_level, template)
        sections.append(ContentSection(
            id=str(uuid.uuid4()),
            type=ContentSectionType.CONCEPT_CARD,
            order=1,
            content=concept_card,
            completion_required=True
        ))
        
        # Code example
        code_example = self._generate_fallback_code_example(topic, tech, template)
        sections.append(ContentSection(
            id=str(uuid.uuid4()),
            type=ContentSectionType.CODE_EXAMPLE,
            order=2,
            content=code_example,
            completion_required=True
        ))
        
        # Knowledge check
        knowledge_check = self._generate_fallback_knowledge_check(
            topic, KnowledgeCheckType.MULTIPLE_CHOICE, 2, template
        )
        sections.append(ContentSection(
            id=str(uuid.uuid4()),
            type=ContentSectionType.KNOWLEDGE_CHECK,
            order=3,
            content=knowledge_check,
            completion_required=True
        ))
        
        return sections
    
    def _generate_fallback_concept_card(
        self,
        concept: str,
        skill_level: str,
        template: Optional[Dict[str, Any]] = None
    ) -> ConceptCard:
        """Generate a fallback concept card with topic-specific content."""
        
        if template:
            # Use template-specific content
            analogy_data = template.get("analogy", {})
            analogy = Analogy(
                title=analogy_data.get("title", "Real-world analogy"),
                description=analogy_data.get("description", ""),
                mapping=analogy_data.get("mapping", {})
            )
            
            mistakes = [
                Mistake(
                    description=m.get("description", ""),
                    example=m.get("example", ""),
                    correction=m.get("correction", "")
                )
                for m in template.get("mistakes", [])
            ]
            
            use_cases = [
                UseCase(
                    scenario=u.get("scenario", ""),
                    example=u.get("example", ""),
                    benefit=u.get("benefit", "")
                )
                for u in template.get("use_cases", [])
            ]
            
            explanation = template.get("explanation", f"{concept} is a fundamental programming concept.")
            
        else:
            # Generic fallback
            analogy = Analogy(
                title="Building Blocks",
                description=f"Think of {concept} like building blocks. Each piece has a specific purpose and fits together with others to create something larger and more complex.",
                mapping={concept: "building block", "code": "structure", "program": "building"}
            )
            
            mistakes = [
                Mistake(
                    description=f"Not fully understanding when to use {concept}",
                    example="Using it in every situation without considering alternatives",
                    correction="Evaluate each situation and choose the most appropriate approach"
                ),
                Mistake(
                    description="Skipping the fundamentals",
                    example="Jumping to advanced usage without understanding basics",
                    correction="Master the basics first, then build on that foundation"
                )
            ]
            
            use_cases = [
                UseCase(
                    scenario=f"When you need to implement {concept} functionality",
                    example="See the code example below",
                    benefit="Cleaner, more maintainable code"
                ),
                UseCase(
                    scenario="When working on team projects",
                    example="Following established patterns",
                    benefit="Consistent, readable codebase"
                )
            ]
            
            explanation = f"""{concept} is a fundamental concept in programming that helps you write cleaner, more maintainable code.

Understanding {concept} will help you:
- Write more efficient code
- Solve problems more effectively  
- Communicate better with other developers

Take your time to understand this concept thoroughly, as it forms the foundation for more advanced topics."""
        
        return ConceptCard(
            id=str(uuid.uuid4()),
            concept_name=concept,
            primary_explanation=explanation,
            analogy=analogy,
            alternative_explanations=[],
            common_mistakes=mistakes,
            when_to_use=use_cases
        )
    
    def _generate_fallback_code_example(
        self,
        concept: str,
        language: str,
        template: Optional[Dict[str, Any]] = None
    ) -> CodeExample:
        """Generate a fallback code example with topic-specific content."""
        lang_map = {
            "javascript": ProgrammingLanguage.JAVASCRIPT,
            "typescript": ProgrammingLanguage.TYPESCRIPT,
            "python": ProgrammingLanguage.PYTHON,
            "java": ProgrammingLanguage.JAVA
        }
        prog_lang = lang_map.get(language.lower(), ProgrammingLanguage.JAVASCRIPT)
        is_python = prog_lang == ProgrammingLanguage.PYTHON
        
        # Topic-specific code examples
        code_examples = {
            "variables": {
                "js": {
                    "starter": """// Variables Practice
// TODO: Create variables to store user information

// 1. Create a variable for the user's name (use let)


// 2. Create a constant for the user's birth year


// 3. Create a variable for whether the user is subscribed (boolean)


// 4. Calculate and store the user's age
const currentYear = 2024;


// Print all the information
console.log("Name:", /* your variable */);
console.log("Age:", /* your calculated age */);
console.log("Subscribed:", /* your boolean */);""",
                    "solution": """// Variables Practice - Solution

// 1. Create a variable for the user's name (use let)
let userName = "Alice";

// 2. Create a constant for the user's birth year
const birthYear = 1995;

// 3. Create a variable for whether the user is subscribed (boolean)
let isSubscribed = true;

// 4. Calculate and store the user's age
const currentYear = 2024;
let age = currentYear - birthYear;

// Print all the information
console.log("Name:", userName);
console.log("Age:", age);
console.log("Subscribed:", isSubscribed);""",
                    "output": "Name: Alice\\nAge: 29\\nSubscribed: true"
                },
                "python": {
                    "starter": """# Variables Practice
# TODO: Create variables to store user information

# 1. Create a variable for the user's name


# 2. Create a variable for the user's birth year


# 3. Create a variable for whether the user is subscribed (boolean)


# 4. Calculate and store the user's age
current_year = 2024


# Print all the information
print(f"Name: {}")  # Add your variable
print(f"Age: {}")   # Add your calculated age
print(f"Subscribed: {}")  # Add your boolean""",
                    "solution": """# Variables Practice - Solution

# 1. Create a variable for the user's name
user_name = "Alice"

# 2. Create a variable for the user's birth year
birth_year = 1995

# 3. Create a variable for whether the user is subscribed (boolean)
is_subscribed = True

# 4. Calculate and store the user's age
current_year = 2024
age = current_year - birth_year

# Print all the information
print(f"Name: {user_name}")
print(f"Age: {age}")
print(f"Subscribed: {is_subscribed}")""",
                    "output": "Name: Alice\\nAge: 29\\nSubscribed: True"
                }
            },
            "functions": {
                "js": {
                    "starter": """// Functions Practice
// TODO: Create functions to calculate shopping cart totals

// 1. Create a function that calculates the subtotal of items
// It should take an array of prices and return the sum
function calculateSubtotal(prices) {
    // Your code here
}

// 2. Create a function that applies a discount percentage
// It should take a subtotal and discount percentage (e.g., 10 for 10%)
function applyDiscount(subtotal, discountPercent) {
    // Your code here
}

// 3. Create a function that calculates tax
// It should take an amount and tax rate (e.g., 0.08 for 8%)
function calculateTax(amount, taxRate) {
    // Your code here
}

// Test your functions
const prices = [29.99, 9.99, 49.99];
const subtotal = calculateSubtotal(prices);
const discounted = applyDiscount(subtotal, 10);
const tax = calculateTax(discounted, 0.08);
const total = discounted + tax;

console.log("Subtotal: $" + subtotal.toFixed(2));
console.log("After 10% discount: $" + discounted.toFixed(2));
console.log("Tax: $" + tax.toFixed(2));
console.log("Total: $" + total.toFixed(2));""",
                    "solution": """// Functions Practice - Solution

// 1. Create a function that calculates the subtotal of items
function calculateSubtotal(prices) {
    let sum = 0;
    for (let price of prices) {
        sum += price;
    }
    return sum;
}

// 2. Create a function that applies a discount percentage
function applyDiscount(subtotal, discountPercent) {
    const discount = subtotal * (discountPercent / 100);
    return subtotal - discount;
}

// 3. Create a function that calculates tax
function calculateTax(amount, taxRate) {
    return amount * taxRate;
}

// Test your functions
const prices = [29.99, 9.99, 49.99];
const subtotal = calculateSubtotal(prices);
const discounted = applyDiscount(subtotal, 10);
const tax = calculateTax(discounted, 0.08);
const total = discounted + tax;

console.log("Subtotal: $" + subtotal.toFixed(2));
console.log("After 10% discount: $" + discounted.toFixed(2));
console.log("Tax: $" + tax.toFixed(2));
console.log("Total: $" + total.toFixed(2));""",
                    "output": "Subtotal: $89.97\\nAfter 10% discount: $80.97\\nTax: $6.48\\nTotal: $87.45"
                },
                "python": {
                    "starter": """# Functions Practice
# TODO: Create functions to calculate shopping cart totals

# 1. Create a function that calculates the subtotal of items
def calculate_subtotal(prices):
    # Your code here
    pass

# 2. Create a function that applies a discount percentage
def apply_discount(subtotal, discount_percent):
    # Your code here
    pass

# 3. Create a function that calculates tax
def calculate_tax(amount, tax_rate):
    # Your code here
    pass

# Test your functions
prices = [29.99, 9.99, 49.99]
subtotal = calculate_subtotal(prices)
discounted = apply_discount(subtotal, 10)
tax = calculate_tax(discounted, 0.08)
total = discounted + tax

print(f"Subtotal: ${subtotal:.2f}")
print(f"After 10% discount: ${discounted:.2f}")
print(f"Tax: ${tax:.2f}")
print(f"Total: ${total:.2f}")""",
                    "solution": """# Functions Practice - Solution

# 1. Create a function that calculates the subtotal of items
def calculate_subtotal(prices):
    return sum(prices)

# 2. Create a function that applies a discount percentage
def apply_discount(subtotal, discount_percent):
    discount = subtotal * (discount_percent / 100)
    return subtotal - discount

# 3. Create a function that calculates tax
def calculate_tax(amount, tax_rate):
    return amount * tax_rate

# Test your functions
prices = [29.99, 9.99, 49.99]
subtotal = calculate_subtotal(prices)
discounted = apply_discount(subtotal, 10)
tax = calculate_tax(discounted, 0.08)
total = discounted + tax

print(f"Subtotal: ${subtotal:.2f}")
print(f"After 10% discount: ${discounted:.2f}")
print(f"Tax: ${tax:.2f}")
print(f"Total: ${total:.2f}")""",
                    "output": "Subtotal: $89.97\\nAfter 10% discount: $80.97\\nTax: $6.48\\nTotal: $87.45"
                }
            },
            "loops": {
                "js": {
                    "starter": """// Loops Practice
// TODO: Use loops to process data

const students = [
    { name: "Alice", score: 85 },
    { name: "Bob", score: 92 },
    { name: "Charlie", score: 78 },
    { name: "Diana", score: 95 },
    { name: "Eve", score: 88 }
];

// 1. Use a for loop to find the highest score
let highestScore = 0;
let topStudent = "";
// Your loop here


// 2. Use a for...of loop to count passing students (score >= 80)
let passingCount = 0;
// Your loop here


// 3. Use a while loop to find the first student with score > 90
let index = 0;
let firstExcellent = null;
// Your loop here


console.log("Top student:", topStudent, "with score:", highestScore);
console.log("Passing students:", passingCount);
console.log("First excellent student:", firstExcellent);""",
                    "solution": """// Loops Practice - Solution

const students = [
    { name: "Alice", score: 85 },
    { name: "Bob", score: 92 },
    { name: "Charlie", score: 78 },
    { name: "Diana", score: 95 },
    { name: "Eve", score: 88 }
];

// 1. Use a for loop to find the highest score
let highestScore = 0;
let topStudent = "";
for (let i = 0; i < students.length; i++) {
    if (students[i].score > highestScore) {
        highestScore = students[i].score;
        topStudent = students[i].name;
    }
}

// 2. Use a for...of loop to count passing students (score >= 80)
let passingCount = 0;
for (let student of students) {
    if (student.score >= 80) {
        passingCount++;
    }
}

// 3. Use a while loop to find the first student with score > 90
let index = 0;
let firstExcellent = null;
while (index < students.length && firstExcellent === null) {
    if (students[index].score > 90) {
        firstExcellent = students[index].name;
    }
    index++;
}

console.log("Top student:", topStudent, "with score:", highestScore);
console.log("Passing students:", passingCount);
console.log("First excellent student:", firstExcellent);""",
                    "output": "Top student: Diana with score: 95\\nPassing students: 4\\nFirst excellent student: Bob"
                },
                "python": {
                    "starter": """# Loops Practice
# TODO: Use loops to process data

students = [
    {"name": "Alice", "score": 85},
    {"name": "Bob", "score": 92},
    {"name": "Charlie", "score": 78},
    {"name": "Diana", "score": 95},
    {"name": "Eve", "score": 88}
]

# 1. Use a for loop to find the highest score
highest_score = 0
top_student = ""
# Your loop here


# 2. Use a for loop to count passing students (score >= 80)
passing_count = 0
# Your loop here


# 3. Use a while loop to find the first student with score > 90
index = 0
first_excellent = None
# Your loop here


print(f"Top student: {top_student} with score: {highest_score}")
print(f"Passing students: {passing_count}")
print(f"First excellent student: {first_excellent}")""",
                    "solution": """# Loops Practice - Solution

students = [
    {"name": "Alice", "score": 85},
    {"name": "Bob", "score": 92},
    {"name": "Charlie", "score": 78},
    {"name": "Diana", "score": 95},
    {"name": "Eve", "score": 88}
]

# 1. Use a for loop to find the highest score
highest_score = 0
top_student = ""
for student in students:
    if student["score"] > highest_score:
        highest_score = student["score"]
        top_student = student["name"]

# 2. Use a for loop to count passing students (score >= 80)
passing_count = 0
for student in students:
    if student["score"] >= 80:
        passing_count += 1

# 3. Use a while loop to find the first student with score > 90
index = 0
first_excellent = None
while index < len(students) and first_excellent is None:
    if students[index]["score"] > 90:
        first_excellent = students[index]["name"]
    index += 1

print(f"Top student: {top_student} with score: {highest_score}")
print(f"Passing students: {passing_count}")
print(f"First excellent student: {first_excellent}")""",
                    "output": "Top student: Diana with score: 95\\nPassing students: 4\\nFirst excellent student: Bob"
                }
            },
            "arrays": {
                "js": {
                    "starter": """// Arrays Practice
// TODO: Use array methods to transform data

const products = [
    { name: "Laptop", price: 999, inStock: true },
    { name: "Mouse", price: 29, inStock: true },
    { name: "Keyboard", price: 79, inStock: false },
    { name: "Monitor", price: 299, inStock: true },
    { name: "Headphones", price: 149, inStock: false }
];

// 1. Use filter() to get only in-stock products
const inStockProducts = // Your code here

// 2. Use map() to get an array of product names
const productNames = // Your code here

// 3. Use filter() and map() together to get names of products under $100
const affordableNames = // Your code here

// 4. Use reduce() to calculate total value of in-stock items
const totalValue = // Your code here

console.log("In stock:", inStockProducts.length, "products");
console.log("Product names:", productNames);
console.log("Affordable products:", affordableNames);
console.log("Total in-stock value: $" + totalValue);""",
                    "solution": """// Arrays Practice - Solution

const products = [
    { name: "Laptop", price: 999, inStock: true },
    { name: "Mouse", price: 29, inStock: true },
    { name: "Keyboard", price: 79, inStock: false },
    { name: "Monitor", price: 299, inStock: true },
    { name: "Headphones", price: 149, inStock: false }
];

// 1. Use filter() to get only in-stock products
const inStockProducts = products.filter(p => p.inStock);

// 2. Use map() to get an array of product names
const productNames = products.map(p => p.name);

// 3. Use filter() and map() together to get names of products under $100
const affordableNames = products
    .filter(p => p.price < 100)
    .map(p => p.name);

// 4. Use reduce() to calculate total value of in-stock items
const totalValue = products
    .filter(p => p.inStock)
    .reduce((sum, p) => sum + p.price, 0);

console.log("In stock:", inStockProducts.length, "products");
console.log("Product names:", productNames);
console.log("Affordable products:", affordableNames);
console.log("Total in-stock value: $" + totalValue);""",
                    "output": "In stock: 3 products\\nProduct names: [ 'Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones' ]\\nAffordable products: [ 'Mouse', 'Keyboard' ]\\nTotal in-stock value: $1327"
                },
                "python": {
                    "starter": """# Arrays (Lists) Practice
# TODO: Use list operations to transform data

products = [
    {"name": "Laptop", "price": 999, "in_stock": True},
    {"name": "Mouse", "price": 29, "in_stock": True},
    {"name": "Keyboard", "price": 79, "in_stock": False},
    {"name": "Monitor", "price": 299, "in_stock": True},
    {"name": "Headphones", "price": 149, "in_stock": False}
]

# 1. Use list comprehension to get only in-stock products
in_stock_products = # Your code here

# 2. Use list comprehension to get a list of product names
product_names = # Your code here

# 3. Get names of products under $100
affordable_names = # Your code here

# 4. Calculate total value of in-stock items
total_value = # Your code here

print(f"In stock: {len(in_stock_products)} products")
print(f"Product names: {product_names}")
print(f"Affordable products: {affordable_names}")
print(f"Total in-stock value: ${total_value}")""",
                    "solution": """# Arrays (Lists) Practice - Solution

products = [
    {"name": "Laptop", "price": 999, "in_stock": True},
    {"name": "Mouse", "price": 29, "in_stock": True},
    {"name": "Keyboard", "price": 79, "in_stock": False},
    {"name": "Monitor", "price": 299, "in_stock": True},
    {"name": "Headphones", "price": 149, "in_stock": False}
]

# 1. Use list comprehension to get only in-stock products
in_stock_products = [p for p in products if p["in_stock"]]

# 2. Use list comprehension to get a list of product names
product_names = [p["name"] for p in products]

# 3. Get names of products under $100
affordable_names = [p["name"] for p in products if p["price"] < 100]

# 4. Calculate total value of in-stock items
total_value = sum(p["price"] for p in products if p["in_stock"])

print(f"In stock: {len(in_stock_products)} products")
print(f"Product names: {product_names}")
print(f"Affordable products: {affordable_names}")
print(f"Total in-stock value: ${total_value}")""",
                    "output": "In stock: 3 products\\nProduct names: ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones']\\nAffordable products: ['Mouse', 'Keyboard']\\nTotal in-stock value: $1327"
                }
            }
        }
        
        # Get topic-specific code or use generic
        topic_lower = concept.lower()
        code_key = None
        for key in code_examples.keys():
            if key in topic_lower or topic_lower in key:
                code_key = key
                break
        
        if code_key:
            lang_key = "python" if is_python else "js"
            example = code_examples[code_key][lang_key]
            starter = example["starter"]
            solution = example["solution"]
            expected = example["output"]
            title = f"{concept} Practice"
            description = f"Practice working with {concept} through this hands-on exercise."
        else:
            # Generic fallback
            if is_python:
                starter = f"""# {concept} Example
# TODO: Implement the function below

def example_function(value):
    \"\"\"
    Process the input value and return a result.
    
    Args:
        value: The input to process
        
    Returns:
        The processed result
    \"\"\"
    # Your code here
    pass

# Test your implementation
result = example_function("test")
print(f"Result: {{result}}")"""
                solution = f"""# {concept} Example - Solution

def example_function(value):
    \"\"\"
    Process the input value and return a result.
    \"\"\"
    # Process and return the value
    return f"Processed: {{value}}"

# Test your implementation
result = example_function("test")
print(f"Result: {{result}}")"""
            else:
                starter = f"""// {concept} Example
// TODO: Implement the function below

/**
 * Process the input value and return a result.
 * @param {{any}} value - The input to process
 * @returns {{string}} The processed result
 */
function exampleFunction(value) {{
    // Your code here
}}

// Test your implementation
const result = exampleFunction("test");
console.log("Result:", result);"""
                solution = f"""// {concept} Example - Solution

function exampleFunction(value) {{
    // Process and return the value
    return "Processed: " + value;
}}

// Test your implementation
const result = exampleFunction("test");
console.log("Result:", result);"""
            
            expected = "Result: Processed: test"
            title = f"{concept} Practice"
            description = f"Practice implementing {concept} with this interactive example."
        
        return CodeExample(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            language=prog_lang,
            starter_code=starter,
            solution_code=solution,
            test_cases=[
                TestCase(
                    input="",
                    expected_output=expected,
                    description="Verify the output matches expected result"
                )
            ],
            hints=[
                "Read the TODO comments carefully for guidance",
                "Look at the expected output to understand what's needed",
                "Test your code incrementally as you write it",
                "Check the solution if you get stuck, then try again"
            ],
            is_editable=True,
            expected_output=expected
        )
    
    def _generate_fallback_knowledge_check(
        self,
        concept: str,
        check_type: KnowledgeCheckType,
        difficulty: int,
        template: Optional[Dict[str, Any]] = None
    ) -> KnowledgeCheck:
        """Generate a fallback knowledge check with topic-specific questions."""
        
        # Topic-specific knowledge checks
        topic_questions = {
            "variables": {
                "question": "What is the main difference between `let` and `const` in JavaScript?",
                "options": [
                    {"id": "a", "text": "`let` allows reassignment, `const` does not", "is_correct": True, "feedback": "Correct! `let` creates a variable that can be reassigned, while `const` creates a constant that cannot be reassigned after initialization."},
                    {"id": "b", "text": "`const` is faster than `let`", "is_correct": False, "feedback": "Performance is not the difference. Both have similar performance characteristics."},
                    {"id": "c", "text": "`let` is for numbers, `const` is for strings", "is_correct": False, "feedback": "Both can hold any data type. The difference is about reassignment, not data types."},
                    {"id": "d", "text": "`const` variables can only be used once", "is_correct": False, "feedback": "`const` variables can be used (read) as many times as needed, they just can't be reassigned."}
                ],
                "correct_answer": "a",
                "explanation": "`let` declares a variable that can be reassigned later, while `const` declares a constant whose value cannot be changed after initialization. Use `const` by default and `let` only when you need to reassign.",
                "hint": "Think about what happens when you try to change the value after declaration."
            },
            "functions": {
                "question": "What does a function return if there is no explicit return statement?",
                "options": [
                    {"id": "a", "text": "null", "is_correct": False, "feedback": "Close, but not quite. `null` is an explicit value that must be returned."},
                    {"id": "b", "text": "undefined", "is_correct": True, "feedback": "Correct! Functions without a return statement (or with an empty return) return `undefined` by default."},
                    {"id": "c", "text": "0", "is_correct": False, "feedback": "Functions don't return 0 by default. That would need to be explicitly returned."},
                    {"id": "d", "text": "An error is thrown", "is_correct": False, "feedback": "No error is thrown. The function simply returns `undefined`."}
                ],
                "correct_answer": "b",
                "explanation": "In JavaScript, if a function doesn't have a return statement, or has an empty `return;`, it returns `undefined`. This is important to remember when using function results.",
                "hint": "What value represents 'nothing was returned'?"
            },
            "loops": {
                "question": "Which loop is best when you know exactly how many times you need to iterate?",
                "options": [
                    {"id": "a", "text": "while loop", "is_correct": False, "feedback": "While loops are better when you don't know the iteration count in advance."},
                    {"id": "b", "text": "do-while loop", "is_correct": False, "feedback": "Do-while is for when you need at least one iteration, regardless of the condition."},
                    {"id": "c", "text": "for loop", "is_correct": True, "feedback": "Correct! For loops are ideal when you know the exact number of iterations, as they combine initialization, condition, and increment in one line."},
                    {"id": "d", "text": "forEach method", "is_correct": False, "feedback": "forEach is great for arrays, but a for loop gives you more control over the iteration count."}
                ],
                "correct_answer": "c",
                "explanation": "The `for` loop is designed for situations where you know how many times to iterate. Its structure `for (init; condition; increment)` makes it clear and concise for counted loops.",
                "hint": "Which loop type has the iteration count built into its structure?"
            },
            "arrays": {
                "question": "What does the `filter()` method return?",
                "options": [
                    {"id": "a", "text": "The first element that matches the condition", "is_correct": False, "feedback": "That's what `find()` does, not `filter()`."},
                    {"id": "b", "text": "A new array with elements that pass the test", "is_correct": True, "feedback": "Correct! `filter()` creates a new array containing all elements that pass the provided test function."},
                    {"id": "c", "text": "The original array, modified in place", "is_correct": False, "feedback": "`filter()` doesn't modify the original array; it returns a new one."},
                    {"id": "d", "text": "A boolean indicating if any element matches", "is_correct": False, "feedback": "That's what `some()` does. `filter()` returns an array."}
                ],
                "correct_answer": "b",
                "explanation": "`filter()` creates and returns a new array containing all elements from the original array that pass the test implemented by the provided function. The original array is not modified.",
                "hint": "Think about what 'filter' means - keeping some items and removing others."
            },
            "objects": {
                "question": "How do you access a property with a name stored in a variable?",
                "options": [
                    {"id": "a", "text": "object.variableName", "is_correct": False, "feedback": "This looks for a property literally named 'variableName', not the value stored in the variable."},
                    {"id": "b", "text": "object[variableName]", "is_correct": True, "feedback": "Correct! Bracket notation evaluates the expression inside, so it uses the value of the variable as the property name."},
                    {"id": "c", "text": "object->variableName", "is_correct": False, "feedback": "This syntax is from other languages like PHP or C++, not JavaScript."},
                    {"id": "d", "text": "object.get(variableName)", "is_correct": False, "feedback": "Regular objects don't have a `get()` method. That's for Maps."}
                ],
                "correct_answer": "b",
                "explanation": "Bracket notation `object[key]` evaluates the expression inside the brackets. So if `key = 'name'`, then `object[key]` is equivalent to `object['name']` or `object.name`.",
                "hint": "Which notation allows you to use an expression or variable?"
            },
            "conditionals": {
                "question": "What is the difference between `==` and `===` in JavaScript?",
                "options": [
                    {"id": "a", "text": "`===` is faster than `==`", "is_correct": False, "feedback": "While `===` can be slightly faster, that's not the main difference."},
                    {"id": "b", "text": "`==` compares values, `===` compares values and types", "is_correct": True, "feedback": "Correct! `==` performs type coercion before comparing, while `===` requires both value and type to match."},
                    {"id": "c", "text": "`===` is for strings, `==` is for numbers", "is_correct": False, "feedback": "Both operators work with all types. The difference is about type coercion."},
                    {"id": "d", "text": "They are exactly the same", "is_correct": False, "feedback": "They behave differently! `5 == '5'` is true, but `5 === '5'` is false."}
                ],
                "correct_answer": "b",
                "explanation": "`==` (loose equality) converts operands to the same type before comparing. `===` (strict equality) compares both value and type without conversion. Best practice is to use `===` to avoid unexpected type coercion.",
                "hint": "What happens when you compare a number to a string with each operator?"
            },
            "async": {
                "question": "What does `await` do in an async function?",
                "options": [
                    {"id": "a", "text": "Makes the entire program wait", "is_correct": False, "feedback": "Only the async function pauses, not the entire program. Other code can still run."},
                    {"id": "b", "text": "Pauses execution until the Promise resolves", "is_correct": True, "feedback": "Correct! `await` pauses the async function's execution until the Promise settles, then returns the resolved value."},
                    {"id": "c", "text": "Converts a value to a Promise", "is_correct": False, "feedback": "While await can work with non-Promise values, its main purpose is to wait for Promises."},
                    {"id": "d", "text": "Catches any errors automatically", "is_correct": False, "feedback": "You still need try/catch to handle errors. `await` just waits for the Promise."}
                ],
                "correct_answer": "b",
                "explanation": "`await` pauses the execution of an async function until the Promise is resolved. The resolved value is then returned. If the Promise rejects, an error is thrown (which you should catch with try/catch).",
                "hint": "Think about what 'await' means in everyday language."
            },
            "classes": {
                "question": "What is the purpose of the `constructor` method in a class?",
                "options": [
                    {"id": "a", "text": "To define static methods", "is_correct": False, "feedback": "Static methods are defined with the `static` keyword, not in the constructor."},
                    {"id": "b", "text": "To initialize new instances of the class", "is_correct": True, "feedback": "Correct! The constructor is called automatically when you create a new instance with `new`, and it's used to set up the initial state."},
                    {"id": "c", "text": "To inherit from another class", "is_correct": False, "feedback": "Inheritance is done with the `extends` keyword, not the constructor."},
                    {"id": "d", "text": "To destroy instances when they're no longer needed", "is_correct": False, "feedback": "JavaScript has garbage collection; there's no destructor in the constructor."}
                ],
                "correct_answer": "b",
                "explanation": "The `constructor` method is a special method that's automatically called when you create a new instance using `new ClassName()`. It's used to initialize the object's properties and set up its initial state.",
                "hint": "What happens when you use the `new` keyword?"
            }
        }
        
        # Find matching topic question
        topic_lower = concept.lower()
        question_data = None
        for key, data in topic_questions.items():
            if key in topic_lower or topic_lower in key:
                question_data = data
                break
        
        if question_data:
            options = [
                Option(
                    id=o["id"],
                    text=o["text"],
                    is_correct=o["is_correct"],
                    feedback=o["feedback"]
                )
                for o in question_data["options"]
            ]
            
            return KnowledgeCheck(
                id=str(uuid.uuid4()),
                question=question_data["question"],
                type=check_type,
                options=options,
                correct_answer=question_data["correct_answer"],
                explanation=question_data["explanation"],
                hint=question_data["hint"],
                difficulty=difficulty
            )
        
        # Generic fallback
        return KnowledgeCheck(
            id=str(uuid.uuid4()),
            question=f"Which of the following best describes {concept}?",
            type=check_type,
            options=[
                Option(
                    id="a",
                    text=f"A fundamental programming concept that helps organize and structure code",
                    is_correct=True,
                    feedback="Correct! This captures the essence of the concept."
                ),
                Option(
                    id="b",
                    text="A rarely used advanced technique only for experts",
                    is_correct=False,
                    feedback="Not quite. This is actually a commonly used concept at all skill levels."
                ),
                Option(
                    id="c",
                    text="Something only used in specific programming languages",
                    is_correct=False,
                    feedback="This concept applies across many programming languages and paradigms."
                ),
                Option(
                    id="d",
                    text="An outdated practice that has been replaced by newer methods",
                    is_correct=False,
                    feedback="This is still a relevant and widely recommended practice in modern development."
                )
            ],
            correct_answer="a",
            explanation=f"{concept} is indeed a fundamental concept that helps you write better, more organized code. It's widely used across different programming languages and is essential for any developer to understand.",
            hint="Think about how this concept helps you structure and organize your code.",
            difficulty=difficulty
        )


# Factory function
def create_content_generator_service(
    llm_service: Optional[LLMService] = None
) -> ContentGeneratorService:
    """Create a ContentGeneratorService instance."""
    return ContentGeneratorService(llm_service)
