import React from 'react';
import { useSkipLinks } from '../../hooks/useAccessibility';

export interface SkipLink {
  id: string;
  label: string;
  href?: string;
}

export interface SkipLinksProps {
  links: SkipLink[];
  className?: string;
}

const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links, 
  className = '' 
}) => {
  const { skipLinkProps } = useSkipLinks(links);

  return (
    <nav 
      className={`skip-links ${className}`}
      aria-label="Skip navigation links"
    >
      {links.map((link) => (
        <a
          key={link.id}
          {...skipLinkProps(link.id, link.label)}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipLinks;
