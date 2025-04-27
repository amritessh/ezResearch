// backend/src/services/pdf/structureAnalyzer.js
const nlp = require('compromise');

const identifySections = paperText => {
  // Define common section patterns
  const sectionPatterns = [
    { name: 'Abstract', regex: /abstract/i },
    {
      name: 'Introduction',
      regex: /introduction|^1(\.\s*|\.?\s+)introduction/i
    },
    { name: 'Background', regex: /background|^2(\.\s*|\.?\s+)background/i },
    {
      name: 'Related Work',
      regex: /related\s+work|previous\s+work|^[2-3](\.\s*|\.?\s+)related/i
    },
    {
      name: 'Methodology',
      regex: /methodology|methods|^[3-4](\.\s*|\.?\s+)(methodology|methods)/i
    },
    {
      name: 'Implementation',
      regex: /implementation|^[4-5](\.\s*|\.?\s+)implementation/i
    },
    {
      name: 'Results',
      regex: /results|evaluation|experiments|^[5-6](\.\s*|\.?\s+)(results|evaluation)/i
    },
    { name: 'Discussion', regex: /discussion|^[6-7](\.\s*|\.?\s+)discussion/i },
    { name: 'Conclusion', regex: /conclusion|^[7-8](\.\s*|\.?\s+)conclusion/i },
    { name: 'References', regex: /references|bibliography/i }
  ];

  // Split text into lines and identify potential section headers
  const lines = paperText.split('\n');
  const sections = [];
  let currentSection = { name: 'Header', content: '', startLine: 0 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Check if this line is a section header
    let isSectionHeader = false;

    for (const pattern of sectionPatterns) {
      if (pattern.regex.test(line) && line.length < 100) {
        // Looks like a section header

        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push({
            ...currentSection,
            endLine: i - 1
          });
        }

        // Start new section
        currentSection = {
          name: pattern.name,
          rawHeader: line,
          content: '',
          startLine: i + 1
        };

        isSectionHeader = true;
        break;
      }
    }

    if (!isSectionHeader) {
      // Add to current section content
      currentSection.content += line + '\n';
    }
  }

  // Add final section
  if (currentSection.content.trim()) {
    sections.push({
      ...currentSection,
      endLine: lines.length - 1
    });
  }

  return sections;
};

const analyzeCitations = paperText => {
  // Identify common citation patterns
  const inlineCitations = [];

  // Regular expressions for common citation formats
  const patterns = [
    // IEEE style: [1], [2, 3], [4-6]
    { regex: /\[(\d+(?:[-,\s]+\d+)*)\]/g, style: 'ieee' },

    // Harvard style: (Smith, 2020), (Smith and Jones, 2019)
    {
      regex: /\(([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)?,\s+\d{4}[a-z]?)\)/g,
      style: 'harvard'
    },

    // APA style: (Smith et al., 2020)
    { regex: /\(([A-Z][a-z]+\s+et\s+al\.,\s+\d{4}[a-z]?)\)/g, style: 'apa' }
  ];

  // Extract citations using each pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(paperText)) !== null) {
      inlineCitations.push({
        text: match[0],
        reference: match[1],
        position: match.index,
        style: pattern.style
      });
    }
  }

  return inlineCitations;
};

const identifyFigureReferences = paperText => {
  const figures = [];

  // Match patterns like "Figure 1", "Fig. 2", "Fig 3", "Table 1", etc.
  const figurePattern = /(figure|fig\.?|table)\s+(\d+)(?:\s*[.:]?\s*([^.!?\n]+))?/gi;

  let match;
  while ((match = figurePattern.exec(paperText)) !== null) {
    figures.push({
      type: match[1].toLowerCase().startsWith('fig') ? 'figure' : 'table',
      number: parseInt(match[2]),
      caption: match[3] ? match[3].trim() : '',
      position: match.index
    });
  }

  return figures;
};

module.exports = {
  identifySections,
  analyzeCitations,
  identifyFigureReferences
};
