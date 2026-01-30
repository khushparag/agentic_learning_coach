"""
Property-based tests for visual branding consistency across the comprehensive project video.

This module validates that all video sections maintain consistent visual branding including:
- Typography consistency (fonts, sizes, weights, spacing)
- Color palette consistency throughout the video
- Design token usage and adherence
- Brand element consistency (logos, styling, themes)
- Professional visual presentation standards

**Validates: Requirements 1.5, 9.1, 9.3**
"""

import pytest
from hypothesis import given, strategies as st, settings, assume
from typing import Dict, List, Any, Optional, Tuple
import re
import json
from pathlib import Path

# Import test configuration and strategies
from .strategies import (
    video_section_strategy,
    typography_config_strategy,
    color_palette_strategy,
    design_token_strategy,
    brand_element_strategy
)

# Constants for branding validation
REQUIRED_FONTS = {
    'title': 'Inter, sans-serif',
    'subtitle': 'Inter, sans-serif', 
    'body': 'Inter, sans-serif',
    'code': 'JetBrains Mono, monospace',
    'caption': 'Inter, sans-serif'
}

REQUIRED_COLORS = {
    'primary': '#3b82f6',
    'secondary': '#10b981',
    'accent': '#8b5cf6',
    'success': '#22c55e',
    'warning': '#f59e0b',
    'error': '#ef4444',
    'info': '#06b6d4'
}

TYPOGRAPHY_SCALE = {
    'title': {'fontSize': 48, 'fontWeight': 'bold', 'lineHeight': 1.2},
    'subtitle': {'fontSize': 32, 'fontWeight': '600', 'lineHeight': 1.3},
    'body': {'fontSize': 24, 'fontWeight': '400', 'lineHeight': 1.4},
    'code': {'fontSize': 20, 'fontWeight': '400', 'lineHeight': 1.5},
    'caption': {'fontSize': 18, 'fontWeight': '400', 'lineHeight': 1.3}
}

SPACING_SCALE = {
    'xs': 4, 'sm': 8, 'md': 16, 'lg': 24, 'xl': 32, 'xxl': 48, 'xxxl': 64
}

BORDER_RADIUS_SCALE = {
    'none': 0, 'sm': 4, 'md': 8, 'lg': 12, 'xl': 16, 'full': 9999
}


class VisualBrandingValidator:
    """Validator for visual branding consistency across video sections."""
    
    def __init__(self):
        self.validation_errors = []
        self.warnings = []
    
    def validate_typography_consistency(self, sections: List[Dict[str, Any]]) -> bool:
        """
        Validate typography consistency across all video sections.
        
        Args:
            sections: List of video section configurations
            
        Returns:
            bool: True if typography is consistent, False otherwise
        """
        typography_configs = []
        
        for section in sections:
            if 'typography' in section:
                typography_configs.append(section['typography'])
        
        if not typography_configs:
            self.validation_errors.append("No typography configurations found")
            return False
        
        # Check font family consistency
        base_fonts = typography_configs[0]
        for i, config in enumerate(typography_configs[1:], 1):
            for text_type, expected_font in REQUIRED_FONTS.items():
                if text_type in config:
                    actual_font = config[text_type].get('fontFamily', '')
                    if actual_font != expected_font:
                        self.validation_errors.append(
                            f"Section {i}: Font family mismatch for {text_type}. "
                            f"Expected: {expected_font}, Got: {actual_font}"
                        )
        
        # Check font size consistency with scale
        for i, config in enumerate(typography_configs):
            for text_type, scale_config in TYPOGRAPHY_SCALE.items():
                if text_type in config:
                    actual_size = config[text_type].get('fontSize', 0)
                    expected_size = scale_config['fontSize']
                    if actual_size != expected_size:
                        self.validation_errors.append(
                            f"Section {i}: Font size mismatch for {text_type}. "
                            f"Expected: {expected_size}px, Got: {actual_size}px"
                        )
        
        return len(self.validation_errors) == 0
    
    def validate_color_consistency(self, sections: List[Dict[str, Any]]) -> bool:
        """
        Validate color palette consistency across all video sections.
        
        Args:
            sections: List of video section configurations
            
        Returns:
            bool: True if colors are consistent, False otherwise
        """
        color_configs = []
        
        for section in sections:
            if 'colors' in section:
                color_configs.append(section['colors'])
        
        if not color_configs:
            self.validation_errors.append("No color configurations found")
            return False
        
        # Check primary brand colors consistency
        for i, config in enumerate(color_configs):
            for color_name, expected_value in REQUIRED_COLORS.items():
                if color_name in config:
                    actual_value = config[color_name]
                    if actual_value != expected_value:
                        self.validation_errors.append(
                            f"Section {i}: Color mismatch for {color_name}. "
                            f"Expected: {expected_value}, Got: {actual_value}"
                        )
        
        # Check background color consistency
        background_colors = set()
        for config in color_configs:
            if 'background' in config:
                bg_config = config['background']
                if isinstance(bg_config, dict):
                    for bg_type, bg_color in bg_config.items():
                        background_colors.add((bg_type, bg_color))
        
        # Validate background color usage is consistent
        expected_backgrounds = {
            ('dark', '#0f172a'),
            ('medium', '#1e293b'),
            ('light', '#334155')
        }
        
        for bg_type, bg_color in background_colors:
            if (bg_type, bg_color) not in expected_backgrounds:
                self.warnings.append(
                    f"Non-standard background color used: {bg_type}={bg_color}"
                )
        
        return len(self.validation_errors) == 0
    
    def validate_design_token_usage(self, sections: List[Dict[str, Any]]) -> bool:
        """
        Validate design token usage and adherence across sections.
        
        Args:
            sections: List of video section configurations
            
        Returns:
            bool: True if design tokens are used consistently, False otherwise
        """
        for i, section in enumerate(sections):
            # Check spacing usage
            if 'spacing' in section:
                spacing_config = section['spacing']
                for spacing_key, spacing_value in spacing_config.items():
                    if spacing_key in SPACING_SCALE:
                        expected_value = SPACING_SCALE[spacing_key]
                        if spacing_value != expected_value:
                            self.validation_errors.append(
                                f"Section {i}: Spacing token mismatch for {spacing_key}. "
                                f"Expected: {expected_value}px, Got: {spacing_value}px"
                            )
                    else:
                        self.warnings.append(
                            f"Section {i}: Non-standard spacing token used: {spacing_key}"
                        )
            
            # Check border radius usage
            if 'borderRadius' in section:
                radius_config = section['borderRadius']
                for radius_key, radius_value in radius_config.items():
                    if radius_key in BORDER_RADIUS_SCALE:
                        expected_value = BORDER_RADIUS_SCALE[radius_key]
                        if radius_value != expected_value:
                            self.validation_errors.append(
                                f"Section {i}: Border radius token mismatch for {radius_key}. "
                                f"Expected: {expected_value}px, Got: {radius_value}px"
                            )
        
        return len(self.validation_errors) == 0
    
    def validate_brand_element_consistency(self, sections: List[Dict[str, Any]]) -> bool:
        """
        Validate brand element consistency (logos, styling, themes).
        
        Args:
            sections: List of video section configurations
            
        Returns:
            bool: True if brand elements are consistent, False otherwise
        """
        logo_configs = []
        theme_configs = []
        
        for section in sections:
            if 'logo' in section:
                logo_configs.append(section['logo'])
            if 'theme' in section:
                theme_configs.append(section['theme'])
        
        # Check logo consistency
        if logo_configs:
            base_logo = logo_configs[0]
            for i, logo_config in enumerate(logo_configs[1:], 1):
                # Check logo size consistency
                if 'size' in base_logo and 'size' in logo_config:
                    if base_logo['size'] != logo_config['size']:
                        self.validation_errors.append(
                            f"Section {i}: Logo size inconsistency. "
                            f"Expected: {base_logo['size']}, Got: {logo_config['size']}"
                        )
                
                # Check logo positioning consistency
                if 'position' in base_logo and 'position' in logo_config:
                    if base_logo['position'] != logo_config['position']:
                        self.warnings.append(
                            f"Section {i}: Logo position variation detected"
                        )
        
        # Check theme consistency
        if theme_configs:
            base_theme = theme_configs[0]
            for i, theme_config in enumerate(theme_configs[1:], 1):
                if theme_config != base_theme:
                    self.warnings.append(
                        f"Section {i}: Theme variation detected"
                    )
        
        return len(self.validation_errors) == 0
    
    def validate_professional_presentation(self, sections: List[Dict[str, Any]]) -> bool:
        """
        Validate professional visual presentation standards.
        
        Args:
            sections: List of video section configurations
            
        Returns:
            bool: True if presentation meets professional standards, False otherwise
        """
        for i, section in enumerate(sections):
            # Check for proper contrast ratios
            if 'colors' in section:
                colors = section['colors']
                if 'text' in colors and 'background' in colors:
                    # Simplified contrast check (would use actual contrast calculation in real implementation)
                    text_colors = colors['text']
                    bg_colors = colors['background']
                    
                    if isinstance(text_colors, dict) and isinstance(bg_colors, dict):
                        # Check primary text on dark background
                        if 'primary' in text_colors and 'dark' in bg_colors:
                            text_color = text_colors['primary']
                            bg_color = bg_colors['dark']
                            
                            # Light text on dark background should be used
                            if not (text_color.startswith('#f') and bg_color.startswith('#0')):
                                self.warnings.append(
                                    f"Section {i}: Potential contrast issue detected"
                                )
            
            # Check for consistent animation timing
            if 'animations' in section:
                animations = section['animations']
                for animation in animations:
                    if 'duration' in animation:
                        duration = animation['duration']
                        # Animations should be reasonable (0.5s to 3s)
                        if duration < 0.5 or duration > 3.0:
                            self.warnings.append(
                                f"Section {i}: Animation duration outside recommended range: {duration}s"
                            )
        
        return len(self.validation_errors) == 0
    
    def get_validation_report(self) -> Dict[str, Any]:
        """Get comprehensive validation report."""
        return {
            'errors': self.validation_errors,
            'warnings': self.warnings,
            'error_count': len(self.validation_errors),
            'warning_count': len(self.warnings),
            'is_valid': len(self.validation_errors) == 0
        }


@given(video_section_strategy())
@settings(max_examples=100, deadline=None)
def test_typography_consistency_property(video_sections):
    """
    **Property 1: Visual Branding Consistency - Typography**
    
    For any set of video sections, typography configuration should maintain 
    consistency with the defined brand standards and design system.
    
    **Validates: Requirements 1.5, 9.1, 9.3**
    """
    assume(len(video_sections) >= 2)  # Need at least 2 sections to test consistency
    
    validator = VisualBrandingValidator()
    
    # Test typography consistency
    is_consistent = validator.validate_typography_consistency(video_sections)
    
    if not is_consistent:
        report = validator.get_validation_report()
        pytest.fail(
            f"Typography consistency validation failed:\n"
            f"Errors: {report['errors']}\n"
            f"Warnings: {report['warnings']}"
        )
    
    # Additional assertions for typography properties
    for section in video_sections:
        if 'typography' in section:
            typography = section['typography']
            
            # All text types should use approved fonts
            for text_type, config in typography.items():
                if text_type in REQUIRED_FONTS:
                    expected_font = REQUIRED_FONTS[text_type]
                    actual_font = config.get('fontFamily', '')
                    assert actual_font == expected_font, (
                        f"Font family mismatch for {text_type}: "
                        f"expected {expected_font}, got {actual_font}"
                    )
            
            # Font sizes should follow the typography scale
            for text_type, config in typography.items():
                if text_type in TYPOGRAPHY_SCALE:
                    expected_size = TYPOGRAPHY_SCALE[text_type]['fontSize']
                    actual_size = config.get('fontSize', 0)
                    assert actual_size == expected_size, (
                        f"Font size mismatch for {text_type}: "
                        f"expected {expected_size}px, got {actual_size}px"
                    )


@given(video_section_strategy())
@settings(max_examples=100, deadline=None)
def test_color_palette_consistency_property(video_sections):
    """
    **Property 1: Visual Branding Consistency - Colors**
    
    For any set of video sections, color palette should maintain consistency 
    with the defined brand colors and design system.
    
    **Validates: Requirements 1.5, 9.1, 9.3**
    """
    assume(len(video_sections) >= 2)  # Need at least 2 sections to test consistency
    
    validator = VisualBrandingValidator()
    
    # Test color consistency
    is_consistent = validator.validate_color_consistency(video_sections)
    
    if not is_consistent:
        report = validator.get_validation_report()
        pytest.fail(
            f"Color consistency validation failed:\n"
            f"Errors: {report['errors']}\n"
            f"Warnings: {report['warnings']}"
        )
    
    # Additional assertions for color properties
    for section in video_sections:
        if 'colors' in section:
            colors = section['colors']
            
            # Primary brand colors should match exactly
            for color_name, expected_value in REQUIRED_COLORS.items():
                if color_name in colors:
                    actual_value = colors[color_name]
                    assert actual_value == expected_value, (
                        f"Brand color mismatch for {color_name}: "
                        f"expected {expected_value}, got {actual_value}"
                    )
            
            # Background colors should be from approved palette
            if 'background' in colors and isinstance(colors['background'], dict):
                bg_colors = colors['background']
                approved_bg_colors = {'#0f172a', '#1e293b', '#334155'}
                
                for bg_type, bg_color in bg_colors.items():
                    if isinstance(bg_color, str) and bg_color.startswith('#'):
                        assert bg_color in approved_bg_colors, (
                            f"Non-approved background color used: {bg_color}"
                        )


@given(video_section_strategy())
@settings(max_examples=100, deadline=None)
def test_design_token_adherence_property(video_sections):
    """
    **Property 1: Visual Branding Consistency - Design Tokens**
    
    For any set of video sections, design token usage should adhere to the 
    defined spacing, sizing, and styling standards.
    
    **Validates: Requirements 1.5, 9.1, 9.3**
    """
    assume(len(video_sections) >= 1)
    
    validator = VisualBrandingValidator()
    
    # Test design token usage
    is_consistent = validator.validate_design_token_usage(video_sections)
    
    if not is_consistent:
        report = validator.get_validation_report()
        pytest.fail(
            f"Design token validation failed:\n"
            f"Errors: {report['errors']}\n"
            f"Warnings: {report['warnings']}"
        )
    
    # Additional assertions for design token properties
    for section in video_sections:
        # Check spacing token usage
        if 'spacing' in section:
            spacing = section['spacing']
            for spacing_key, spacing_value in spacing.items():
                if spacing_key in SPACING_SCALE:
                    expected_value = SPACING_SCALE[spacing_key]
                    assert spacing_value == expected_value, (
                        f"Spacing token mismatch for {spacing_key}: "
                        f"expected {expected_value}px, got {spacing_value}px"
                    )
        
        # Check border radius token usage
        if 'borderRadius' in section:
            border_radius = section['borderRadius']
            for radius_key, radius_value in border_radius.items():
                if radius_key in BORDER_RADIUS_SCALE:
                    expected_value = BORDER_RADIUS_SCALE[radius_key]
                    assert radius_value == expected_value, (
                        f"Border radius token mismatch for {radius_key}: "
                        f"expected {expected_value}px, got {radius_value}px"
                    )


@given(video_section_strategy())
@settings(max_examples=100, deadline=None)
def test_brand_element_consistency_property(video_sections):
    """
    **Property 1: Visual Branding Consistency - Brand Elements**
    
    For any set of video sections, brand elements (logos, styling, themes) 
    should maintain consistency across all sections.
    
    **Validates: Requirements 1.5, 9.1, 9.3**
    """
    assume(len(video_sections) >= 2)  # Need at least 2 sections to test consistency
    
    validator = VisualBrandingValidator()
    
    # Test brand element consistency
    is_consistent = validator.validate_brand_element_consistency(video_sections)
    
    if not is_consistent:
        report = validator.get_validation_report()
        pytest.fail(
            f"Brand element consistency validation failed:\n"
            f"Errors: {report['errors']}\n"
            f"Warnings: {report['warnings']}"
        )
    
    # Additional assertions for brand element properties
    logo_sizes = []
    theme_names = []
    
    for section in video_sections:
        if 'logo' in section:
            logo = section['logo']
            if 'size' in logo:
                logo_sizes.append(logo['size'])
        
        if 'theme' in section:
            theme_names.append(section['theme'])
    
    # Logo sizes should be consistent across sections
    if len(logo_sizes) > 1:
        base_size = logo_sizes[0]
        for size in logo_sizes[1:]:
            assert size == base_size, (
                f"Logo size inconsistency detected: {size} != {base_size}"
            )
    
    # Theme should be consistent (allowing for reasonable variations)
    if len(theme_names) > 1:
        unique_themes = set(theme_names)
        assert len(unique_themes) <= 2, (
            f"Too many theme variations: {unique_themes}"
        )


@given(video_section_strategy())
@settings(max_examples=100, deadline=None)
def test_professional_presentation_standards_property(video_sections):
    """
    **Property 1: Visual Branding Consistency - Professional Standards**
    
    For any set of video sections, visual presentation should meet professional 
    standards including appropriate contrast, timing, and visual hierarchy.
    
    **Validates: Requirements 1.5, 9.1, 9.3**
    """
    assume(len(video_sections) >= 1)
    
    validator = VisualBrandingValidator()
    
    # Test professional presentation standards
    meets_standards = validator.validate_professional_presentation(video_sections)
    
    if not meets_standards:
        report = validator.get_validation_report()
        pytest.fail(
            f"Professional presentation validation failed:\n"
            f"Errors: {report['errors']}\n"
            f"Warnings: {report['warnings']}"
        )
    
    # Additional assertions for professional standards
    for section in video_sections:
        # Check for proper visual hierarchy
        if 'typography' in section:
            typography = section['typography']
            
            # Title should be larger than subtitle
            if 'title' in typography and 'subtitle' in typography:
                title_size = typography['title'].get('fontSize', 0)
                subtitle_size = typography['subtitle'].get('fontSize', 0)
                assert title_size > subtitle_size, (
                    f"Title size ({title_size}) should be larger than subtitle ({subtitle_size})"
                )
            
            # Subtitle should be larger than body
            if 'subtitle' in typography and 'body' in typography:
                subtitle_size = typography['subtitle'].get('fontSize', 0)
                body_size = typography['body'].get('fontSize', 0)
                assert subtitle_size > body_size, (
                    f"Subtitle size ({subtitle_size}) should be larger than body ({body_size})"
                )
        
        # Check animation timing is reasonable
        if 'animations' in section:
            animations = section['animations']
            for animation in animations:
                if 'duration' in animation:
                    duration = animation['duration']
                    assert 0.1 <= duration <= 5.0, (
                        f"Animation duration should be between 0.1s and 5.0s, got {duration}s"
                    )


# Integration test for complete visual branding validation
def test_complete_visual_branding_validation():
    """
    Integration test that validates complete visual branding consistency
    across a realistic video configuration.
    """
    # Sample video configuration representing actual video sections
    sample_sections = [
        {
            'name': 'introduction',
            'typography': {
                'title': {'fontSize': 48, 'fontWeight': 'bold', 'fontFamily': 'Inter, sans-serif', 'lineHeight': 1.2},
                'subtitle': {'fontSize': 32, 'fontWeight': '600', 'fontFamily': 'Inter, sans-serif', 'lineHeight': 1.3},
                'body': {'fontSize': 24, 'fontWeight': '400', 'fontFamily': 'Inter, sans-serif', 'lineHeight': 1.4}
            },
            'colors': {
                'primary': '#3b82f6',
                'secondary': '#10b981',
                'accent': '#8b5cf6',
                'background': {'dark': '#0f172a', 'medium': '#1e293b'},
                'text': {'primary': '#f8fafc', 'secondary': '#e2e8f0'}
            },
            'spacing': {'md': 16, 'lg': 24, 'xl': 32},
            'borderRadius': {'md': 8, 'lg': 12},
            'logo': {'size': 120, 'position': 'center'},
            'theme': 'dark'
        },
        {
            'name': 'overview',
            'typography': {
                'title': {'fontSize': 48, 'fontWeight': 'bold', 'fontFamily': 'Inter, sans-serif', 'lineHeight': 1.2},
                'subtitle': {'fontSize': 32, 'fontWeight': '600', 'fontFamily': 'Inter, sans-serif', 'lineHeight': 1.3},
                'body': {'fontSize': 24, 'fontWeight': '400', 'fontFamily': 'Inter, sans-serif', 'lineHeight': 1.4}
            },
            'colors': {
                'primary': '#3b82f6',
                'secondary': '#10b981',
                'accent': '#8b5cf6',
                'background': {'dark': '#0f172a', 'medium': '#1e293b'},
                'text': {'primary': '#f8fafc', 'secondary': '#e2e8f0'}
            },
            'spacing': {'md': 16, 'lg': 24, 'xl': 32},
            'borderRadius': {'md': 8, 'lg': 12},
            'logo': {'size': 120, 'position': 'center'},
            'theme': 'dark'
        }
    ]
    
    validator = VisualBrandingValidator()
    
    # Run all validation checks
    typography_valid = validator.validate_typography_consistency(sample_sections)
    color_valid = validator.validate_color_consistency(sample_sections)
    token_valid = validator.validate_design_token_usage(sample_sections)
    brand_valid = validator.validate_brand_element_consistency(sample_sections)
    professional_valid = validator.validate_professional_presentation(sample_sections)
    
    # Get validation report
    report = validator.get_validation_report()
    
    # Assert all validations pass
    assert typography_valid, f"Typography validation failed: {report['errors']}"
    assert color_valid, f"Color validation failed: {report['errors']}"
    assert token_valid, f"Design token validation failed: {report['errors']}"
    assert brand_valid, f"Brand element validation failed: {report['errors']}"
    assert professional_valid, f"Professional standards validation failed: {report['errors']}"
    
    # Assert overall validation success
    assert report['is_valid'], f"Overall validation failed: {report}"
    
    print(f"✅ Visual branding validation passed with {report['warning_count']} warnings")


if __name__ == "__main__":
    # Run the integration test directly
    test_complete_visual_branding_validation()
    print("All visual branding consistency tests passed!")