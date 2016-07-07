import CustomComponents from './CustomComponents';
import markdownToHtml from '../../Core/markdownToHtml';
import parseCustomHtmlToReact from './parseCustomHtmlToReact';

function parseCustomMarkdownToReact(raw, context) {
    const html = markdownToHtml(raw, false, {
        ADD_TAGS: CustomComponents.names(),
        ADD_ATTR: CustomComponents.attributes()
    });
    return parseCustomHtmlToReact('<div>' + html + '</div>', context);
}

module.exports = parseCustomMarkdownToReact;
