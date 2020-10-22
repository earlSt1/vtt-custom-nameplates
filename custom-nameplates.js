export const modName = "Custom Nameplates";
export const mod = "custom-nameplates";

async function setAllTokenNameplateStyles(){
    let allSettings = await game.settings.get(mod,'global-style');
    for (let token of canvas.layers.filter(x => x.name==='TokenLayer')[0].objects.children){
        if (token.nameplate != null){
            if (token.nameplate.style != null){
                token.nameplate.style.fontSize = allSettings.fontSize;
                token.nameplate.style.fontFamily = allSettings.fontFamily;
                token.nameplate.style.fill = allSettings.fontColor;
                token.nameplate.style.dropShadowColor = allSettings.shadowColor;
                token.nameplate.style.stroke= allSettings.strokeColor;
            }
        }
    }
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
        game.settings.set(mod,'global-style',globalSettings).then(() => {
            ui.notifications.notify('Updated global nameplate style');
            setAllTokenNameplateStyles()
        })
    }
    /** @override */
    async close(options){
        setAllTokenNameplateStyles();
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
        await game.settings.set(mod,'global-style',{
            'fontFamily':'Signika',
            'fontSize':24,
            'fontColor':'#FFFFFF',
            'shadowColor':'#000000',
            'strokeColor':'#111111'
        })
    }
}
Hooks.on('setup',() => {
    registerSettings()
    Hooks.on("updateToken",async () => {
        setAllTokenNameplateStyles();
    });
    Hooks.on("canvasReady",async () => {
        setAllTokenNameplateStyles();
    });
});
