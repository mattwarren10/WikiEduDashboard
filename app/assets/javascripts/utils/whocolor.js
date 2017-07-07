const isSpecialTokenStart = (token) => {
  return ['{{', '[[', '<', '['].includes(token.str);
};

const specialTokenEnd = {
  '{{': '}}',
  '[[': ']]',
  '<': '>',
  '[': ']'
};

const isFormattingMarkup = (token) => {
  return ["'", '='].includes(token.str);
};

const annotatedMarkup = (markup, token) => {
  if (isFormattingMarkup(token)) { return markup; }
  return `<span class="author-token token-authorid-${token.editor}">${markup}</span>`;
};

export default function whocolor(markup, wikiwho) {
  // We're going to iterate through the wikiwho tokens, building up a new version
  // of the original markup, with extra spans that include data from the tokens.
  let newMarkup = '';
  // Start at the beginning of the original markup, and keep track of the position
  // relative to it.
  let stringPosition = 0;
  // Keep an ordered list of any open special markup, like the start of a template
  // or an html tag, for which we're awaiting the corresponding closing tag.
  const specialMarkupStarted = [];
  // The tokens are all lowercase, so we must use a lower-cased version of the
  // original markup for matching the tokens. The length should be the same, so
  // the position indexes still correspond between the original markup and the
  // markupToProcess versions.
  let markupToProcess = markup.toLowerCase();
  // wikiwho object looks like { revisions: [{ <latestRevId>: revisionObject }]}
  // We want to pluck out that revisionObject, which contains the tokens.
  const revision = Object.entries(wikiwho.revisions[0])[0][1];
  revision.tokens.forEach((token) => {
    // Tokens look like this: {"o_rev_id":63116626,"str":"written","editor":"1533857"}
    // In includes the rev_id where the string was introduced, the string itself, and
    // the id of user who added it in that revision.

    // Find the indexes for the start and end of the token string.
    const tokenStart = markupToProcess.indexOf(token.str);
    const tokenEnd = tokenStart + token.str.length;
    // Add everything until the start position of the token from the original markup.
    // This is typically whitespace, which is not included in the tokens.
    const nonTokenMarkup = markup.slice(stringPosition, stringPosition + tokenStart);
    newMarkup += nonTokenMarkup;

    // Some special tokens are the start of markup syntax than cannot be broken up
    // with interstitial spans. For these, we store the started sequence and do not
    // add spans until that sequence has closed.
    const innermostSpecialMarkup = specialMarkupStarted[specialMarkupStarted.length - 1];
    if (isSpecialTokenStart(token)) {
      specialMarkupStarted.push(token.str);
      const tokenMarkup = markup.slice(stringPosition + tokenStart, stringPosition + tokenEnd);
      newMarkup += tokenMarkup;

    // If special markup is already open (and a new nested one isn't starting) then
    // check if it's ending. Do not add spans.
    } else if (innermostSpecialMarkup) {
      if (token.str === specialTokenEnd[innermostSpecialMarkup]) {
        specialMarkupStarted.pop();
      }
      const tokenMarkup = markup.slice(stringPosition + tokenStart, stringPosition + tokenEnd);
      newMarkup += tokenMarkup;
    // If the token is outside of special markup altogether, annotate it.
    } else {
      const tokenMarkup = markup.slice(stringPosition + tokenStart, stringPosition + tokenEnd);
      newMarkup += annotatedMarkup(tokenMarkup, token);
    }

    // Prepare for processing the next token: discard the markupToProcess up to
    // and including the token string, and update stringPosition.
    markupToProcess = markupToProcess.slice(tokenEnd);
    stringPosition += tokenEnd;
  });
  console.log(newMarkup)
  return newMarkup;
}
