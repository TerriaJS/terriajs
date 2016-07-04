import CustomComponents from '../Models/CustomComponents';
import markdownToHtml from './markdownToHtml';
import parseCustomHtmlToReact from '../Models/parseCustomHtmlToReact';

function renderMarkdownInReact(raw, context) {
    const html = markdownToHtml(raw, false, {
        ADD_TAGS: CustomComponents.names(),
        ADD_ATTR: CustomComponents.attributes()
    });
    return parseCustomHtmlToReact('<div>' + html + '</div>', context);
}

module.exports = renderMarkdownInReact;
