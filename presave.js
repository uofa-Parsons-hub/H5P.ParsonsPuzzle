var H5PEditor = H5PEditor || {};
var H5PPresave = H5PPresave || {};

/**
 * Resolve the presave logic for the content type Parsons Puzzle
 *
 * @param {object} content
 * @param finished
 * @constructor
 */
H5PPresave['H5P.ParsonsPuzzle'] = function (content, finished) {
  var presave = H5PEditor.Presave;
  var score = 0;
  if (isContentValid()) {
    var pattern = /\*.*?\*/g;
    score = content.codeText.match(pattern || []).length;
  }

  presave.validateScore(score);

  finished({maxScore: score});

  /**
   * Check if required parameters is present
   * @return {boolean}
   */
  function isContentValid() {
    return presave.checkNestedRequirements(content, 'content.codeText');
  }
};
