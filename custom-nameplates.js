"use strict";
import { libWrapper } from "./shim.js";

export const modName = "Custom Nameplates";
export const mod = "custom-nameplates";
export const DEFAULT_STYLE = {
    fontFamily: "Signika",
    fontSize: 24,
    fill: "#FFFFFF",
    dropShadowColor: "#000000",
    stroke: "#111111",
};
export class StyleDefinition {
    constructor(fontSize, fontFamily, fontColor, shadowColor, strokeColor, autoScale = false) {
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.fontColor = fontColor;
        this.shadowColor = shadowColor;
        this.strokeColor = strokeColor;
        this.autoScale = autoScale;
    }
    static fromSetting(setting) {
        return new StyleDefinition(
            setting.fontSize,
            setting.fontFamily,
            setting.fontColor,
            setting.shadowColor,
            setting.strokeColor,
            setting.autoScale
        );
    }
    toCanvasTextStyle() {
        return {
            fontSize: this.fontSize + "px",
            fontFamily: this.fontFamily,
            fill: this.fontColor,
            dropShadowColor: this.shadowColor,
            stroke: this.strokeColor,
        };
    }
}
export const DEFAULT_STYLE_DEFINITION = new StyleDefinition(24, "Signika", "#FFFFFF", "#000000", "#111111");
export class CustomNameplates {
    constructor(game, canvas, config, mergeObject) {
        this.game = game;
        this.canvas = canvas;
        this.CONFIG = config;
        this.mergeObject = mergeObject;
    }
    loadGlobalStyle() {
        const setting = this.game.settings.get(mod, "global-style");
        const style = StyleDefinition.fromSetting(setting);
        return style;
    }
    loadLocalStyles() {
        const setting = this.game.settings.get(mod, "local-styles");
        let localStyles = new Map();
        for (const key of Object.keys(setting)) {
            localStyles.set(key, StyleDefinition.fromSetting(setting[key]));
        }
        return localStyles;
    }
    getLocalStyle(sceneId) {
        return this.loadLocalStyles().get(sceneId);
    }
    async setLocalStyle(sceneId, styleDefinition) {
        let localStyles = this.loadLocalStyles();
        localStyles.set(sceneId, styleDefinition);
        await this.saveLocalStyles(Object.fromEntries(localStyles));
    }
    async saveLocalStyles(localStyles) {
        await game.settings.set("custom-nameplates", "local-styles", localStyles);
    }
    async saveGlobalStyle(globalStyle) {
        await game.settings.set("custom-nameplates", "global-style", globalStyle);
    }
    async deleteLocalStyle(sceneId) {
        let localStyles = this.loadLocalStyles();
        localStyles.delete(sceneId);
        await this.saveLocalStyles(localStyles);
    }
    isSceneBeingViewed() {
        return this.game.scenes?.viewed;
    }
    setCanvasStyle() {
        const globalStyle = this.loadGlobalStyle();
        const localStyles = this.loadLocalStyles();
        if (this.isSceneBeingViewed()) {
            if (localStyles.has(this.game.scenes.viewed.id)) {
                this.setCanvasStyleTo(localStyles.get(this.game.scenes.viewed.id));
            } else {
                this.setCanvasStyleTo(globalStyle);
            }
        }
        this.updateNameplatesOnCanvas();
    }
    setCanvasStyleTo(style) {
        if (style) {
            this.mergeObject(this.CONFIG.canvasTextStyle, style.toCanvasTextStyle());
        }
    }
    updateNameplatesOnCanvas() {
        if (this.isSceneBeingViewed()) {
            if (this.canvas.tokens) {
                for (let token of this.canvas.tokens.placeables) {
                    if (token.nameplate) {
                        this.mergeObject(token.nameplate.style, this.CONFIG.canvasTextStyle);
                    }
                }
            }
            if (this.canvas.templates) {
                for (let template of this.canvas.templates.placeables) {
                    if (template.ruler) {
                        this.mergeObject(template.ruler.style, this.CONFIG.canvasTextStyle);
                    }
                }
            }
            if (this.canvas.notes) {
                for (let note of this.canvas.notes.placeables) {
                    if (note.tooltip) {
                        this.mergeObject(note.tooltip.style, this.CONFIG.canvasTextStyle);
                    }
                }
            }
        }
    }
    isAutoScaleEnabledForScene() {
        return this.loadLocalStyles().has(this.game.scenes.viewed.id) || this.loadGlobalStyle().autoScale;
    }
    checkAutoScale(canvas) {
        if (canvas.tokens.preview.children.length > 0 || canvas.templates.preview.children.length > 0) return;
        if (this.isSceneBeingViewed()) {
            if (this.isAutoScaleEnabledForScene()) {
                CustomNameplates._autoScaleTokenNameplates(canvas);
                CustomNameplates._autoScaleTemplateNameplates(canvas);
                CustomNameplates._autoScaleNotes(canvas);
            }
        }
    }
    static _autoScaleTokenNameplates(canvas) {
        if (canvas.tokens) {
            for (let token of canvas.tokens.placeables) {
                if (token.nameplate) {
                    token.nameplate.scale.set(this._calculateAutoScale(canvas.scene.dimensions.size, canvas.stage.scale.x));
                }
            }
        }
    }
    static _autoScaleTemplateNameplates(canvas) {
        if (document.querySelector('.scene-control.active[data-control="measure"]')) {
            if (canvas.templates) {
                for (let template of canvas.templates.placeables) {
                    if (template.ruler) {
                        template.ruler.scale.set(this._calculateAutoScale(canvas.scene.dimensions.size, canvas.stage.scale.x));
                    }
                }
            }
        }
    }
    static _autoScaleNotes(canvas) {
        if (canvas.notes) {
            for (let note of canvas.notes.placeables) {
                note.tooltip.scale.set(this._calculateAutoScale(canvas.scene.dimensions.size, canvas.stage.scale.x));
            }
        }
    }
    static _calculateAutoScale(sceneDimensionSize, zoomStage) {
        // Taken from Easy Ruler Scale, a mod by Kandashi
        // https://github.com/kandashi/easy-ruler-scale
        const gs = sceneDimensionSize / 100;
        const zs = 1 / zoomStage;
        return Math.max(gs * zs, 0.8);
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
        return "Edit Nameplate Style";
    }
    async getData(options) {
        let localStyle = game.customNameplates.getLocalStyle(game.scenes.viewed.id);
        let hasLocalSettings = localStyle != null;
        if (!localStyle) {
            localStyle = DEFAULT_STYLE;
        }
        return {
            globalSettings: game.customNameplates.loadGlobalStyle(),
            localSettings: localStyle,
            hasLocalSettings: hasLocalSettings,
            fontFamilies: FontConfig.getAvailableFontChoices(),
        };
    }
    async _updateObject(event, formData) {
        if (formData.localConfig) {
            let localStyle = {
                fontFamily: formData.localFontFamily,
                fontSize: formData.localFontSize,
                fontColor: formData.localFontColor,
                shadowColor: formData.localShadowColor,
                strokeColor: formData.localStrokeColor,
                autoScale: formData.localAutoScaleFont,
            };
            await game.customNameplates.setLocalStyle(game.scenes.viewed.id, localStyle);
        } else {
            let globalStyle = {
                fontFamily: formData.globalFontFamily,
                fontSize: formData.globalFontSize,
                fontColor: formData.globalFontColor,
                shadowColor: formData.globalShadowColor,
                strokeColor: formData.globalStrokeColor,
                autoScale: formData.globalAutoScaleFont,
            };
            await game.customNameplates.saveGlobalStyle(globalStyle);

            //Remove local settings (as local settings not enabled)
            if (game.customNameplates.isSceneBeingViewed()) {
                await game.customNameplates.deleteLocalStyle(game.scenes.viewed.id);
            }
        }
        ui.notifications.notify("Updated nameplate styles. Please refresh for changes to apply");
        game.customNameplates.setCanvasStyle();
    }
}

async function registerSettings() {
    game.customNameplates = new CustomNameplates(game, canvas, CONFIG, foundry.utils.mergeObject);
    game.settings.register(mod, "global-style", {
        scope: "world",
        config: false,
        type: Object,
        default: DEFAULT_STYLE,
    });
    /*
     * Scene specific config
     * use game.scenes.viewed.id as key to style
     */
    game.settings.register(mod, "local-styles", {
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });
    game.settings.registerMenu(mod, "settingsMenu", {
        name: "Configuration",
        label: "Global Settings",
        icon: "fas fa-wrench",
        type: NameplateEditConfig,
        restricted: true,
    });
    let existing = game.customNameplates.loadGlobalStyle();
    if (Object.keys(existing).length < 5) {
        await game.customNameplates.setGlobalStyle(DEFAULT_STYLE);
    }
    game.customNameplates.setCanvasStyle(existing);
    registerLibWrapper();
}
function registerLibWrapper() {
    //Override token getTextStyle to prevent it from changing
    libWrapperRegister(
        "Token.prototype._getTextStyle",
        function (wrapped, ...args) {
            return foundry.utils.mergeObject(wrapped(...args), CONFIG.canvasTextStyle);
        },
        "WRAPPER"
    );
    //Mesured Template style change
    libWrapperRegister(
        "MeasuredTemplate.prototype._refreshRulerText",
        function (wrapped, ...args) {
            wrapped(...args);
            this.ruler.style = foundry.utils.mergeObject(this.ruler.style, CONFIG.canvasTextStyle);
        },
        "WRAPPER"
    );
    // Notes change
    libWrapperRegister(
        "Note.prototype._getTextStyle",
        function (wrapped, ...args) {
            return foundry.utils.mergeObject(wrapped(...args), CONFIG.canvasTextStyle);
        },
        "WRAPPER"
    );
}
function libWrapperRegister(target, wrapper, type) {
    libWrapper.register(mod, target, wrapper, type);
}
Hooks.on("setup", async () => {
    await registerSettings();
    Hooks.on("canvasInit", () => {
        game.customNameplates.setCanvasStyle();
    });
    Hooks.once("canvasReady", () => {
        Hooks.on("canvasPan", (c) => {
            game.customNameplates.checkAutoScale(c);
        });
    });
});
