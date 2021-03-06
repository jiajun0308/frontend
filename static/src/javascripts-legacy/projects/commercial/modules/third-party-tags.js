/**
 * A regionalised container for all the commercial tags.
 */
define([
    'Promise',
    'common/utils/$',
    'common/utils/config',
    'common/utils/detect',
    'common/utils/mediator',
    'common/utils/fastdom-promise',
    'common/utils/template',
    'common/modules/commercial/commercial-features',
    'commercial/modules/third-party-tags/audience-science-gateway',
    'commercial/modules/third-party-tags/audience-science-pql',
    'commercial/modules/third-party-tags/imr-worldwide',
    'commercial/modules/third-party-tags/imr-worldwide-legacy',
    'commercial/modules/third-party-tags/remarketing',
    'commercial/modules/third-party-tags/krux',
    'common/modules/identity/api',
    'commercial/modules/third-party-tags/outbrain',
    'commercial/modules/third-party-tags/plista',
    'text!common/views/commercial/external-content.html'
], function (
    Promise,
    $,
    config,
    detect,
    mediator,
    fastdom,
    template,
    commercialFeatures,
    audienceScienceGateway,
    audienceSciencePql,
    imrWorldwide,
    imrWorldwideLegacy,
    remarketing,
    krux,
    identity,
    outbrain,
    plista,
    externalContentContainerStr
    ) {

    function loadExternalContentWidget() {

        var externalTpl = template(externalContentContainerStr);

        function findAnchor() {
            var selector = !(config.page.seriesId || config.page.blogIds) ?
                '.js-related, .js-outbrain-anchor' :
                '.js-outbrain-anchor';
            return Promise.resolve(document.querySelector(selector));
        }

        function renderWidget(widgetType, init) {
            findAnchor()
            .then(function (anchorNode) {
                return fastdom.write(function () {
                    $(anchorNode).after(externalTpl({widgetType: widgetType}));
                })
            })
            .then(init);
        }

        var isMobileOrTablet = ['mobile', 'tablet'].indexOf(detect.getBreakpoint(false)) >= 0;
        var shouldIgnoreSwitch =  isMobileOrTablet || config.page.section === 'world' || config.page.edition.toLowerCase() !== 'au';
        var shouldServePlista = config.switches.plistaForOutbrainAu && !shouldIgnoreSwitch;

        if (shouldServePlista) {
            renderWidget('plista', plista.init);
        } else {
            renderWidget('outbrain', outbrain.init);
        }
    }

    function init() {

        if (!commercialFeatures.thirdPartyTags) {
            return Promise.resolve(false);
        }

        // Outbrain/Plista needs to be loaded before first ad as it is checking for presence of high relevance component on page
        loadExternalContentWidget();

        loadOther();
        return Promise.resolve(true);
    }

    function loadOther() {
        var services = [
            audienceSciencePql,
            audienceScienceGateway,
            imrWorldwide,
            imrWorldwideLegacy,
            remarketing,
            krux
        ].filter(function (_) { return _.shouldRun; });

        if (services.length) {
            insertScripts(services);
        }
    }

    function insertScripts(services) {
        var ref = document.scripts[0];
        var frag = document.createDocumentFragment();
        while (services.length) {
            var service = services.shift();
            var script = document.createElement('script');
            script.src = service.url;
            script.onload = service.onLoad;
            frag.appendChild(script);
        }
        ref.parentNode.insertBefore(frag, ref);
    }

    return {
        init: init
    };
});
