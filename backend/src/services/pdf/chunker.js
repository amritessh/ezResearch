const createChunks = paperData => {
  const chunks = [];
  let chunkId = 0;

  // Chunk by sections first
  if (paperData.sections && paperData.sections.length > 0) {
    paperData.sections.forEach(section => {
      // Skip empty sections or references
      if (!section.content.trim() || section.name === 'References') {
        return;
      }

      // Split section content into paragraphs
      const paragraphs = section.content.split(/\n\s*\n/);

      paragraphs.forEach(paragraph => {
        // Skip very short paragraphs (likely noise)
        if (paragraph.trim().length < 50) {
          return;
        }

        // Create chunk
        chunks.push({
          id: `chunk_${chunkId++}`,
          section: section.name,
          text: paragraph.trim(),
          charCount: paragraph.length,
          wordCount: paragraph.trim().split(/\s+/).length
        });
      });

      // If section is very short, consider it a single chunk
      if (chunks.length === 0 && section.content.trim().length >= 50) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          section: section.name,
          text: section.content.trim(),
          charCount: section.content.length,
          wordCount: section.content.trim().split(/\s+/).length
        });
      }
    });
  } else {
    // No sections found, chunk by paragraphs
    const paragraphs = paperData.text.split(/\n\s*\n/);

    paragraphs.forEach(paragraph => {
      // Skip very short paragraphs
      if (paragraph.trim().length < 50) {
        return;
      }

      chunks.push({
        id: `chunk_${chunkId++}`,
        section: 'Unknown',
        text: paragraph.trim(),
        charCount: paragraph.length,
        wordCount: paragraph.trim().split(/\s+/).length
      });
    });
  }

  // If chunks are too large, split them further
  const MAX_CHUNK_SIZE = 1000; // characters
  const finalChunks = [];

  chunks.forEach(chunk => {
    if (chunk.charCount <= MAX_CHUNK_SIZE) {
      finalChunks.push(chunk);
    } else {
      // Split large chunk into sentences
      const sentences = chunk.text.match(/[^.!?]+[.!?]+/g) || [chunk.text];

      let currentChunk = {
        id: `chunk_${chunkId++}`,
        section: chunk.section,
        text: '',
        charCount: 0,
        wordCount: 0
      };

      sentences.forEach(sentence => {
        // If adding this sentence would exceed max size, save current chunk and start new one
        if (
          currentChunk.charCount + sentence.length > MAX_CHUNK_SIZE &&
          currentChunk.text
        ) {
          finalChunks.push({
            ...currentChunk,
            wordCount: currentChunk.text.trim().split(/\s+/).length
          });

          currentChunk = {
            id: `chunk_${chunkId++}`,
            section: chunk.section,
            text: '',
            charCount: 0,
            wordCount: 0
          };
        }

        // Add sentence to current chunk
        currentChunk.text += sentence;
        currentChunk.charCount += sentence.length;
      });

      // Add final chunk if not empty
      if (currentChunk.text) {
        finalChunks.push({
          ...currentChunk,
          wordCount: currentChunk.text.trim().split(/\s+/).length
        });
      }
    }
  });

  return finalChunks;
};

module.exports = {
  createChunks
};
