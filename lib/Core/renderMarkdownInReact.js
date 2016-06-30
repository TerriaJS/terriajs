import CustomComponents from '../Models/CustomComponents';
import markdownToHtml from './markdownToHtml';
import parseCustomHtmlToReact from '../Models/parseCustomHtmlToReact';

function renderMarkdownInReact(raw, catalogItem, feature) {
    const html = markdownToHtml(raw, false, {
        ADD_TAGS: CustomComponents.names(),
        ADD_ATTR: CustomComponents.attributes()
    });
    return parseCustomHtmlToReact('<div>' + html + '</div>', catalogItem, feature);
}

module.exports = renderMarkdownInReact;
