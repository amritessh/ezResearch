const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { promisify } = require('util');
const exec = promisify(require('child-prcess').exec);

const extractWithPyMuPDF = async(filePath)=>{
  try{
    const scriptPath = path.join(__dirname, 'scripts', 'extract_pdf.py');
    const outputPath = '${filePath}.json';

    await exec('python ${scriptPath} "${filePath}" "{outputPath}"');
    
    const rawData = fs.readFileSync(outputPath, 'utf8');
    const extractedData = JSON.parse(rawData);

    fs.unlinkSync(outputPath);

    return extractedData;

  } catch(error){
    console.error("PyMuPDF extraction error:", error);
    throw new Error('Failed to extract pdf content with PyMuPDF');
  }

  const extractWithPdfParse = async(filePath) =>{
    try{
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

  return{
    text: data.text;
    pageCount: data.numpages;
    metadata:{
    title: data.info.Title || '',
    author: data.info.Author || '',
    subject: data.info.Subject || '',
    keywords: data.info.Keywords || ''
  }
  };
} catch(error){
  console.error('pdf-parse extraction error:', error);
  throw new Error('Failed to extract PDF content with pdf-parse');
}
};


const extractTextFromPDF = async(filepPath);
return result;
  } catch(error){
  console.warn('Failing back to pdf-parse for extraction');
return extractWithPdfParse(filePath);
}
};

module.exports = {
  extractTextFromPDF
};
