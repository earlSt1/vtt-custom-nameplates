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
    CONFIG.canvasTextStyle.fontSize = style.fontSize;
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
                'strokeColor':formData.localStrokeColor
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
                'strokeColor':formData.globalStrokeColor
            }
            await game.settings.set(mod,'global-style',globalSettings);

            //Remove local settings (as local settings not enabled)
            let existingLocalStyles = game.settings.get(mod,'local-styles');
            if (existingLocalStyles[game.scenes.viewed.id] != null){
                delete existingLocalStyles[game.scenes.viewed.id];
                await game.settings.set(mod,'local-styles',existingLocalStyles);
            }
        }
        ui.notifications.notify('Updated nameplate styles. Please refresh or change scenes to update existing measured templates');
        setSceneConfig();
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
    Token.prototype._getTextStyle = function(){return CONFIG.canvasTextStyle}
}
Hooks.on('setup',() => {
    registerSettings()
    Hooks.on('canvasInit',() => {
        setSceneConfig();
    })
});
