'use strict';
import {libWrapper} from './shim.js';

export const modName = "Custom Nameplates";
export const mod = "custom-nameplates";
export const DEFAULT_STYLE = {
    'fontFamily':'Signika',
    'fontSize':24,
    'fontColor':'#FFFFFF',
    'shadowColor':'#000000',
    'strokeColor':'#111111'
}

async function setSceneConfig(){
    let globalStyle = game.settings.get(mod,'global-style');
    let localStyles = game.settings.get(mod,'local-styles');
    if (localStyles[game.scenes.viewed.id] != null){
        setSceneConfigParam(localStyles[game.scenes.viewed.id]);
    }else{
        setSceneConfigParam(globalStyle);
    }
}
async function setSceneConfigParam(style){
    CONFIG.canvasTextStyle.fontSize = style.fontSize + 'px';
    CONFIG.canvasTextStyle.fontFamily = style.fontFamily;
    CONFIG.canvasTextStyle.fill = style.fontColor;
    CONFIG.canvasTextStyle.dropShadowColor = style.shadowColor;
    CONFIG.canvasTextStyle.stroke= style.strokeColor;
}
class NameplateEditConfig extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "custom-nameplates-edit";
        options.template = "modules/custom-nameplates/templates/nameplate-config.html";
        options.width = 350;
        //options.height = 280;
        return options;
      }
    get title() {
        return "Edit Nameplate Style"
    }
    async getData(options) {
        let localSetting = game.settings.get(mod,'local-styles')[game.scenes.viewed.id]
        let hasLocalSettings = (localSetting != null)
        if (!localSetting){
            localSetting = DEFAULT_STYLE;
        }
        return {
          globalSettings: game.settings.get(mod,'global-style'),
          localSettings: localSetting,
          hasLocalSettings: hasLocalSettings,
          fontFamilies: CONFIG.fontFamilies
        }
      }
    async _updateObject(event, formData) {
        if (formData.localConfig){
            let localSettings = {
                'fontFamily':formData.localFontFamily,
                'fontSize':formData.localFontSize,
                'fontColor':formData.localFontColor,
                'shadowColor':formData.localShadowColor,
                'strokeColor':formData.localStrokeColor,
                'autoScale':formData.globalAutoScaleFont
            }
            let existingLocalStyles = game.settings.get(mod,'local-styles');
            existingLocalStyles[game.scenes.viewed.id] = localSettings;
            await game.settings.set(mod,'local-styles',existingLocalStyles);
        }else{
            let globalSettings = {
                'fontFamily':formData.globalFontFamily,
                'fontSize':formData.globalFontSize,
                'fontColor':formData.globalFontColor,
                'shadowColor':formData.globalShadowColor,
                'strokeColor':formData.globalStrokeColor,
                'autoScale':formData.globalAutoScaleFont
            }
            await game.settings.set(mod,'global-style',globalSettings);

            //Remove local settings (as local settings not enabled)
            let existingLocalStyles = game.settings.get(mod,'local-styles');
            if (existingLocalStyles[game.scenes.viewed.id] != null){
                delete existingLocalStyles[game.scenes.viewed.id];
                await game.settings.set(mod,'local-styles',existingLocalStyles);
            }
        }
        ui.notifications.notify('Updated nameplate styles. Please refresh for changes to apply');
        setSceneConfig();
    }
}
async function checkAutoScale(c){
    if (c.tokens.preview.children.length > 0
        || c.templates.preview.children.length > 0)
        return;
    let globalStyle = game.settings.get(mod,'global-style');
    let localStyle = game.settings.get(mod,'local-styles');
    // Taken from Easy Ruler Scale, a mod by Kandashi
    // https://github.com/kandashi/easy-ruler-scale
    let gs = (c.scene.dimensions.size /100) 
    let zs = 1/c.stage.scale.x

    if ((localStyle[game.scenes.viewed.id] != null && localStyle.autoScale)
            || globalStyle.autoScale && localStyle[game.scenes.viewed.id] == null){
        for (let token of canvas.tokens.placeables){
            token.nameplate.scale.set(Math.max(gs*zs,0.8))
        }
        if (document.querySelector('.scene-control.active[data-control="measure"]')){
            for (let template of canvas.templates.placeables){
                template.ruler.scale.set(Math.max(gs*zs,0.8))
            }
        }
    }
}

async function registerSettings(){
    game.settings.register(mod, 'global-style', {
        scope: 'world',
        config: false,
        type: Object,
        default:DEFAULT_STYLE
    });
    /*
    * Scene specific config
    * use game.scenes.viewed.id as key to style
    */
    game.settings.register(mod, 'local-styles', {
        scope: 'world',
        config: false,
        type: Object,
        default:{}
    });
    game.settings.registerMenu(mod,'settingsMenu',{
        name: 'Configuration',
        label: "Global Settings",
        icon: 'fas fa-wrench',
        type: NameplateEditConfig,
        restricted: true
    });
    let existing = game.settings.get(mod,'global-style')
    if (Object.keys(existing).length<5){
        existing = DEFAULT_STYLE
        await game.settings.set(mod,'global-style',existing)
    }
    setSceneConfigParam(existing);
    //Override token getTextStyle to prevent it from changing
    libWrapper.register(mod,'Token.prototype._getTextStyle',function(wrapped, ...args){
        return foundry.utils.mergeObject(wrapped(...args),CONFIG.canvasTextStyle);
    },'WRAPPER');
    //Mesured Template style change
    libWrapper.register(mod,'MeasuredTemplate.prototype._refreshRulerText',function(wrapped, ...args){
        wrapped(...args);
        this.ruler.style = foundry.utils.mergeObject(this.ruler.style,CONFIG.canvasTextStyle);
    },'WRAPPER');
}
Hooks.on('setup',() => {
    registerSettings()
    Hooks.on('canvasInit',() => {
        setSceneConfig();
    })
    Hooks.once('canvasReady',() => {
        Hooks.on('canvasPan',(c) => {
            checkAutoScale(c); 
        })
    })
});
