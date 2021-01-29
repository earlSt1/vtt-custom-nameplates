export const modName = "Custom Nameplates";
export const mod = "custom-nameplates";

async function setGlobalConfig(){
    let globalStyle = game.settings.get(mod,'global-style');
    setGlobalConfigParam(globalStyle);
}
async function setGlobalConfigParam(style){
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
        return {
          globalSettings: game.settings.get(mod,'global-style'),
          fontFamilies: CONFIG.fontFamilies
        }
      }
    async _updateObject(event, formData) {
        let globalSettings = formData;
        await game.settings.set(mod,'global-style',globalSettings) 
        console.log(globalSettings)
        ui.notifications.notify('Updated global nameplate style. Please refresh to update existing measured templates');
        setGlobalConfigParam(globalSettings)

    }
    /** @override */
    async close(options){
        setGlobalConfig();
        return super.close(options);
    }
}

async function registerSettings(){
    game.settings.register(mod, 'global-style', {
        scope: 'world',
        config: false,
        type: Object,
        default:{
            'fontFamily':'Signika',
            'fontSize':24,
            'fontColor':'#FFFFFF',
            'shadowColor':'#000000',
            'strokeColor':'#111111'
        }
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
        existing = {
            'fontFamily':'Signika',
            'fontSize':24,
            'fontColor':'#FFFFFF',
            'shadowColor':'#000000',
            'strokeColor':'#111111'
        }
        await game.settings.set(mod,'global-style',existing)
    }
    setGlobalConfigParam(existing);
    //Override token getTextStyle to prevent it from changing
    Token.prototype._getTextStyle = function(){return CONFIG.canvasTextStyle}
}
Hooks.on('setup',() => {
    registerSettings()
});
