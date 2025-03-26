/**
 * Generates a custom format JSON for given formatName and comma-separated groupNames.
 * @param {string} formatName - The name for the custom format.
 * @param {string} groupNames - A comma-separated list of group names.
 * @returns {Object} The custom format object.
 */
const generateCustomFormat = (formatName, groupNames) => {
    const specifications = groupNames.split(',').flatMap(groupName => {
      const trimmedGroupName = groupName.trim();
      // Escape special characters for regex
      const sanitizedGroupName = trimmedGroupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use provided regex: case-insensitive with word boundaries
      const regexPattern = `(?i)\\b${sanitizedGroupName}\\b`;
  
      return [
        {
          name: trimmedGroupName,
          implementation: 'ReleaseTitleSpecification',
          negate: false,
          required: false,
          fields: {
            value: regexPattern,
          }
        },
        {
          name: trimmedGroupName,
          implementation: 'ReleaseGroupSpecification',
          negate: false,
          required: false,
          fields: {
            value: regexPattern,
          }
        }
      ];
    });
  
    return {
      name: formatName,
      includeCustomFormatWhenRenaming: false,
      specifications
    };
  };
  
  /**
   * Triggers download of JSON data as a file.
   * @param {Object} data - The JSON object to download.
   * @param {string} fileName - The name of the downloaded file.
   */
  function downloadJSON(data, fileName) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Processes an array of input strings where each input is in the format "formatName|Group1,Group2,Group3"
   * Generates and downloads a JSON file for each input.
   * @param {Array<string>} inputs - Array of input strings.
   */
  const processInputStrings = (inputs) => {
    inputs.forEach(input => {
      // Split input into formatName and group list parts.
      const parts = input.split('|');
      if (parts.length !== 2) {
        console.error(`Invalid input format: ${input}`);
        return;
      }
      const [formatName, groupsPart] = parts;
      const customFormat = generateCustomFormat(formatName.trim(), groupsPart.trim());
      // Create file name: lower case, spaces replaced by hyphen.
      const fileName = formatName.trim().toLowerCase().replace(/\s+/g, '-') + '.json';
      downloadJSON(customFormat, fileName);
    });
  };
  
  // Example usage:
  const inputArray = [
    "My Custom Format|Group1,Group2,Group3",
    "Another Format|Alpha, Beta, Gamma"
  ];
  
  processInputStrings(inputArray);
  