import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { buildShareLink } from './Map/Panels/SharePanel/BuildShareLink';

import Styles from './story-panel.scss';

const stories = [
    {
        id: 0,
        title: "Scene 1",
        text: "Look at this pretty map",
        shareUrl: "#start=%7B%22version%22%3A%220.0.05%22%2C%22initSources%22%3A%5B%7B%22initFragment%22%3A%22terria%22%7D%2C%7B%22sharedCatalogMembers%22%3A%7B%22Root+Group%2FExample+Datasets%22%3A%7B%22isOpen%22%3Atrue%2C%22type%22%3A%22group%22%2C%22parents%22%3A%5B%5D%7D%7D%7D%2C%7B%22initialCamera%22%3A%7B%22west%22%3A148.44197574218865%2C%22south%22%3A-36.26998895934408%2C%22east%22%3A149.7978086556175%2C%22north%22%3A-34.621177426836184%2C%22position%22%3A%7B%22x%22%3A-4575730.88260584%2C%22y%22%3A2736361.240688516%2C%22z%22%3A-3770876.0437535206%7D%2C%22direction%22%3A%7B%22x%22%3A0.6988994887918262%2C%22y%22%3A-0.4179532235029209%2C%22z%22%3A0.5803917707290841%7D%2C%22up%22%3A%7B%22x%22%3A-0.4981172600966621%2C%22y%22%3A0.2978821960504468%2C%22z%22%3A0.8143373947387885%7D%7D%2C%22homeCamera%22%3A%7B%22west%22%3A109%2C%22south%22%3A-45%2C%22east%22%3A158%2C%22north%22%3A-8%7D%2C%22baseMapName%22%3A%22Bing+Maps+Aerial+with+Labels%22%2C%22viewerMode%22%3A%223d%22%2C%22currentTime%22%3A%7B%22dayNumber%22%3A2458445%2C%22secondsOfDay%22%3A58876.156%7D%7D%5D%7D"
    },
    {
        id: 1,
        title: "Scene 2",
        text: "This is an interesting story",
        shareUrl: "#start=%7B%22version%22%3A%220.0.05%22%2C%22initSources%22%3A%5B%7B%22initFragment%22%3A%22terria%22%7D%2C%7B%22catalog%22%3A%5B%7B%22name%22%3A%22User-Added+Data%22%2C%22description%22%3A%22The+group+for+data+that+was+added+by+the+user+via+the+Add+Data+panel.%22%2C%22info%22%3A%5B%5D%2C%22isUserSupplied%22%3Atrue%2C%22isPromoted%22%3Afalse%2C%22isHidden%22%3Afalse%2C%22forceProxy%22%3Afalse%2C%22customProperties%22%3A%7B%7D%2C%22id%22%3A%22Root+Group%2FUser-Added+Data%22%2C%22shortReportSections%22%3A%5B%5D%2C%22isWaitingForDisclaimer%22%3Afalse%2C%22hideSource%22%3Afalse%2C%22nameInCatalog%22%3A%22User-Added+Data%22%2C%22isOpen%22%3Afalse%2C%22items%22%3A%5B%5D%2C%22preserveOrder%22%3Afalse%2C%22type%22%3A%22group%22%2C%22parents%22%3A%5B%5D%7D%5D%7D%2C%7B%22sharedCatalogMembers%22%3A%7B%22Root+Group%2FExample+Datasets%22%3A%7B%22isOpen%22%3Atrue%2C%22type%22%3A%22group%22%2C%22parents%22%3A%5B%5D%7D%2C%22Root+Group%2FExample+Datasets%2Faero3Dpro%22%3A%7B%22isOpen%22%3Atrue%2C%22type%22%3A%22group%22%2C%22parents%22%3A%5B%22Root+Group%2FExample+Datasets%22%5D%7D%2C%22Root+Group%2FExample+Datasets%2FABC+Photo+Stories+%282009-2014%29%22%3A%7B%22nowViewingIndex%22%3A0%2C%22isEnabled%22%3Atrue%2C%22isShown%22%3Atrue%2C%22isLegendVisible%22%3Atrue%2C%22useOwnClock%22%3Afalse%2C%22opacity%22%3A0.8%2C%22keepOnTop%22%3Afalse%2C%22tableStyle%22%3A%7B%22scale%22%3A1%2C%22colorBinMethod%22%3A%22auto%22%2C%22legendTicks%22%3A3%2C%22dataVariable%22%3A%22State%22%2C%22timeColumn%22%3Anull%7D%2C%22type%22%3A%22csv%22%2C%22parents%22%3A%5B%22Root+Group%2FExample+Datasets%22%5D%7D%7D%7D%2C%7B%22initialCamera%22%3A%7B%22west%22%3A141.50853803375247%2C%22south%22%3A-35.1863092003345%2C%22east%22%3A143.4550915326451%2C%22north%22%3A-33.660516777030864%2C%22position%22%3A%7B%22x%22%3A-4277669.8084288%2C%22y%22%3A3284529.1126913554%2C%22z%22%3A-3672512.8400611556%7D%2C%22direction%22%3A%7B%22x%22%3A0.6539748899085625%2C%22y%22%3A-0.5021424422804541%2C%22z%22%3A0.5658354982057104%7D%2C%22up%22%3A%7B%22x%22%3A-0.44879813151092995%2C%22y%22%3A0.3446012887120456%2C%22z%22%3A0.8245181556341228%7D%7D%2C%22homeCamera%22%3A%7B%22west%22%3A109%2C%22south%22%3A-45%2C%22east%22%3A158%2C%22north%22%3A-8%7D%2C%22baseMapName%22%3A%22Bing+Maps+Aerial+with+Labels%22%2C%22viewerMode%22%3A%223d%22%2C%22currentTime%22%3A%7B%22dayNumber%22%3A2458445%2C%22secondsOfDay%22%3A58876%7D%7D%2C%7B%22pickedFeatures%22%3A%7B%22providerCoords%22%3A%7B%7D%2C%22pickCoords%22%3A%7B%22lat%22%3A-34.16783435332972%2C%22lng%22%3A142.07676910071677%2C%22height%22%3A-76.8865837980225%7D%2C%22current%22%3A%7B%22name%22%3A%22Kings+of+the+rodeo%22%2C%22hash%22%3A48071824554%7D%2C%22entities%22%3A%5B%7B%22name%22%3A%22Kings+of+the+rodeo%22%2C%22hash%22%3A48071824554%7D%2C%7B%22name%22%3A%22Heritage+listed+pot+stills+back+in+the+spotlight%22%2C%22hash%22%3A35601635558%7D%5D%7D%7D%5D%7D"
    },
    {
        id: 2,
        title: "Scene 3",
        text: "This place looks warmer",
        shareUrl: "#start=%7B%22version%22%3A%220.0.05%22%2C%22initSources%22%3A%5B%7B%22initFragment%22%3A%22terria%22%7D%2C%7B%22catalog%22%3A%5B%7B%22name%22%3A%22User-Added+Data%22%2C%22description%22%3A%22The+group+for+data+that+was+added+by+the+user+via+the+Add+Data+panel.%22%2C%22info%22%3A%5B%5D%2C%22isUserSupplied%22%3Atrue%2C%22isPromoted%22%3Afalse%2C%22isHidden%22%3Afalse%2C%22forceProxy%22%3Afalse%2C%22customProperties%22%3A%7B%7D%2C%22id%22%3A%22Root+Group%2FUser-Added+Data%22%2C%22shortReportSections%22%3A%5B%5D%2C%22isWaitingForDisclaimer%22%3Afalse%2C%22hideSource%22%3Afalse%2C%22nameInCatalog%22%3A%22User-Added+Data%22%2C%22isOpen%22%3Afalse%2C%22items%22%3A%5B%5D%2C%22preserveOrder%22%3Afalse%2C%22type%22%3A%22group%22%2C%22parents%22%3A%5B%5D%7D%5D%7D%2C%7B%22sharedCatalogMembers%22%3A%7B%22Root+Group%2FExample+Datasets%22%3A%7B%22isOpen%22%3Atrue%2C%22type%22%3A%22group%22%2C%22parents%22%3A%5B%5D%7D%2C%22Root+Group%2FExample+Datasets%2Faero3Dpro%22%3A%7B%22isOpen%22%3Atrue%2C%22type%22%3A%22group%22%2C%22parents%22%3A%5B%22Root+Group%2FExample+Datasets%22%5D%7D%2C%22Root+Group%2FExample+Datasets%2Faero3Dpro%2FBrisbane+3D+city+model+%28aero3Dpro%29%22%3A%7B%22nowViewingIndex%22%3A0%2C%22isEnabled%22%3Atrue%2C%22isShown%22%3Atrue%2C%22isLegendVisible%22%3Atrue%2C%22useOwnClock%22%3Afalse%2C%22type%22%3A%223d-tiles%22%2C%22parents%22%3A%5B%22Root+Group%2FExample+Datasets%22%2C%22Root+Group%2FExample+Datasets%2Faero3Dpro%22%5D%7D%7D%7D%2C%7B%22initialCamera%22%3A%7B%22west%22%3A153.02124390706499%2C%22south%22%3A-27.472998344537537%2C%22east%22%3A153.02559472633988%2C%22north%22%3A-27.4692933780492%2C%22position%22%3A%7B%22x%22%3A-5046770.139175641%2C%22y%22%3A2569120.0378127834%2C%22z%22%3A-2924951.0176187744%7D%2C%22direction%22%3A%7B%22x%22%3A-0.24138596347650423%2C%22y%22%3A-0.575440463451981%2C%22z%22%3A0.7814096810628144%7D%2C%22up%22%3A%7B%22x%22%3A-0.9688399163638665%2C%22y%22%3A0.1889663380491855%2C%22z%22%3A-0.16012788496803804%7D%7D%2C%22homeCamera%22%3A%7B%22west%22%3A109%2C%22south%22%3A-45%2C%22east%22%3A158%2C%22north%22%3A-8%7D%2C%22baseMapName%22%3A%22Bing+Maps+Aerial+with+Labels%22%2C%22viewerMode%22%3A%223d%22%2C%22currentTime%22%3A%7B%22dayNumber%22%3A2458445%2C%22secondsOfDay%22%3A58876%7D%7D%5D%7D"
    }
];

let idCounter = 100;

const StoryPanel = createReactClass({
    propTypes: {
        terria: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            stories,
            newTitle: "",
            newText: ""
        };
    },

    selectStory(id) {
        this.setState(prevState => ({
            stories: prevState.stories.map(story => Object.assign({}, story, {
                selected: story.id === id
            }))
        }));
    },
    activateStory(story) {
        this.props.terria.nowViewing.removeAll();
        window.location = story.shareUrl;
    },

    onSubmit(evt) {
        const shareUrl = buildShareLink(this.props.terria);
        this.setState(prevState => ({
            stories: [...prevState.stories, {
                id: idCounter++,
                title: this.state.newTitle,
                text: this.state.newText,
                shareUrl
            }],
            newTitle: "",
            newText: ""
        }));
        console.log(shareUrl);
        evt.preventDefault();
    },

    updateTitle(evt) {
        this.setState({newTitle: evt.target.value});
    },
    updateText(evt) {
        this.setState({newText: evt.target.value});
    },

    render() {
        return (
            <div className={Styles.storyPanel}>
                {this.state.stories.map(story => <div className={Styles.story} key={story.id} onClick={() => this.activateStory(story)}>
                     <h3>{story.title}</h3>
                     <p>{story.text}</p>
                </div>)}
                <div className={Styles.story}>
                    <form onSubmit={this.onSubmit}>
                        <label htmlFor="title">Title:</label>
                        <input type="text" id="title" value={this.state.newTitle} onChange={this.updateTitle}/>
                        <br/>
                        <label htmlFor="text">Title:</label>
                        <input type="text" id="text" value={this.state.newText} onChange={this.updateText}/>
                        <br/>
                        <input type="submit" value="Capture scene"/>
                    </form>
                </div>
            </div>
        );
    }
});

export default StoryPanel;
