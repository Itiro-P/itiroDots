import { exec } from "ags/process";

export namespace Swww {
    export enum Resize {
        NO = 'no',
        CROP = 'crop',
        FIT = 'fit',
        STRETCH = 'stretch'
    }

    export enum Filter {
        NEAREST = 'Nearest',
        BILINEAR = 'Bilinear',
        CATMULLROM = 'CatmullRom',
        MITCHELL = 'Mitchell',
        LANCZOS3 = 'Lanczos3'
    }

    export enum TransitionType {
        NONE = 'none',
        SIMPLE = 'simple',
        FADE = 'fade',
        LEFT = 'left',
        RIGHT = 'right',
        TOP = 'top',
        BOTTOM = 'bottom',
        WIPE = 'wipe',
        WAVE = 'wave',
        GROW = 'grow',
        CENTER = 'center',
        ANY = 'any',
        RANDOM = 'random'
    }

    export enum TransitionPos {
        CENTER = 'center',
        TOP = 'top',
        LEFT = 'left',
        RIGHT = 'right',
        BOTTOM = 'bottom',
        TOP_LEFT = 'top-left',
        TOP_RIGHT = 'top-right',
        BOTTOM_LEFT = 'bottom-left',
        BOTTOM_RIGHT = 'bottom-right'
    }


    export interface ParserOptions {
        resize: Resize;
        filter: Filter;
        transitionType: TransitionType;
        transitionPos: TransitionPos;
        output: string;
        transitionStep: number;
        transitionDurantion: number;
        transitionAngle: number;
        invertY: boolean;
        transitionWave: { x: number, y: number };
    }


    export class Manager {
        private static _instance: Manager;

        private constructor() {
            const isSwwwRunning = exec("pgrep swww-daemon").length !== 0;
            // Swww não está rodando
            if(!isSwwwRunning) {
                exec(["bash", "-c", "swww-daemon &"]);
            }
        }

        public static get instance() {
            if(!Manager._instance) {
                Manager._instance = new Manager;
            }
            return Manager._instance;
        }

        public setWallpaper(path: string, options?: Partial<ParserOptions>): boolean {
            let command = `swww img ${path}`;
            if(options) {
                if(options.resize) command += ` --resize ${options.resize}`;
                if(options.filter) command += ` -f ${options.filter}`;
                if(options.invertY) command += ` --invert-y ${options.invertY.valueOf()}`;
                if(options.transitionAngle) command += ` --transition-angle ${options.transitionAngle}`;
                if(options.transitionDurantion) command += ` --transition-duration ${options.transitionDurantion}`;
                if(options.transitionPos) command += ` --transition-pos ${options.transitionPos}`;
                if(options.transitionStep) command += ` --transition-step ${options.transitionStep}`;
                if(options.transitionType) command += ` --transition-type ${options.transitionType}`;
                if(options.transitionWave) command += ` --transition-wave ${options.transitionWave.x},${options.transitionWave.y}`;
                if(options.output) command += ` --output ${options.output}`;
            }
            exec(command);
            return true;
        }

        public queryWallpaper(path: string, timeAsMilliseconds: number): boolean {
            return false;
        }
    }
}
