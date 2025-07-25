import { Gtk } from "ags/gtk4";
import Gsk from 'gi://Gsk';
import AstalCava from "gi://AstalCava?version=0.1";
import GObject from 'gi://GObject';
import { Accessor, createBinding, createState, onCleanup, Setter } from "ags";

const CavaConfig = {
    autosens: true,
    bars: 20,
    framerate: 60,
    input: AstalCava.Input.PIPEWIRE,
    noiseReduction: 0.77,
    sensitivity: 0.75,
    stereo: false,
};

class CavaWidget extends Gtk.DrawingArea {
    private valuesAccessor: Accessor<number[]>;
    private unsubAccessor: () => void;

    constructor(v: Accessor<number[]>) {
        super();
        this.set_hexpand(true);
        this.set_vexpand(true);
        this.valuesAccessor = v.as(v => {
            const res: number[] = [];
            const height = this.get_allocated_height();
            for(const i of v) {
                res.push(height - height * Math.max(0, Math.min(1, i)));
            }
            return res;
        });
        this.unsubAccessor = this.valuesAccessor.subscribe(() => this.queue_draw());

        onCleanup(() => this.unsubAccessor);
    }

    override vfunc_snapshot(snapshot: Gtk.Snapshot): void {
        if (!this.get_mapped()) return;

        try {
            if (!this.visible) return;

            const width = this.get_allocated_width();
            const height = this.get_allocated_height();

            if (width <= 0 || height <= 0) return;

            const values = this.valuesAccessor.get();

            if (values.length === 0) return;

            const barWidth = width / (values.length - 1);
            const color = this.parent.get_color();
            const builder = new Gsk.PathBuilder();
            builder.move_to(0, values[0]);
            const invSix = 1 / 6;

            for (let i = 0; i < values.length - 1; i++) {
                const p0x = (i - 1) * barWidth;
                const p0y = values[Math.max(0, i - 1)];
                const p1x = i * barWidth;
                const p1y = values[i];
                const p2x = (i + 1) * barWidth;
                const p2y = values[i + 1];
                const p3x = (i + 2) * barWidth;
                const p3y = values[Math.min(values.length - 1, i + 2)];

                const c1x = p1x + (p2x - p0x) * invSix;
                const c1y = p1y + (p2y - p0y) * invSix;
                const c2x = p2x - (p3x - p1x) * invSix;
                const c2y = p2y - (p3y - p1y) * invSix;

                builder.cubic_to(c1x, c1y, c2x, c2y, p2x, p2y);
            }

            builder.line_to(width, height);
            builder.line_to(0, height);
            builder.close();

            snapshot.append_fill(builder.to_path(), Gsk.FillRule.WINDING, color);
        } catch (error) {
            console.warn("Erro no snapshot do Cava:", error);
        }
    }
}

const _cava = GObject.registerClass({ GTypeName: 'Cava' }, CavaWidget);

export default class Cava {
    private static _instance: Cava;
    private default: AstalCava.Cava | null;
    private _values: Accessor<number[]>;

    private _shouldCavaAppear: Accessor<boolean>;
    private _setShouldCavaAppear: Setter<boolean>;

    private constructor() {
        [this._shouldCavaAppear, this._setShouldCavaAppear] = createState(true);

        this.default = AstalCava.get_default();
        if (this.default) {
            this.default.set_autosens(CavaConfig.autosens);
            this.default.set_bars(CavaConfig.bars);
            this.default.set_framerate(CavaConfig.framerate);
            this.default.set_input(CavaConfig.input);
            this.default.set_noise_reduction(CavaConfig.noiseReduction);
            this.default.set_stereo(CavaConfig.stereo);
            this._values = createBinding(this.default, 'values').as((v) => {
                try {
                    const sens = CavaConfig.sensitivity;
                    return v.map((i) => i * sens);
                } catch (error) {
                    console.warn("Erro no handler global do Cava:", error);
                    return [];
                }
            });
        }
        else {
            console.error("Não foi possível inicializar o Cava");
            this._values = createState<number[]>([])[0];
        }
    }

    public static get instance() {
        if(!this._instance) {
            this._instance = new Cava;
        }
        return this._instance;
    }

    public toggleShouldCavaAppear() {
        this._setShouldCavaAppear(!this._shouldCavaAppear.get());
    }

    public get shouldCavaAppear() {
        return this._shouldCavaAppear;
    }



    public Cava(cssClasses: string[]) {
        return (
            <box cssClasses={[...cssClasses, "Cava"]} overflow={Gtk.Overflow.HIDDEN} visible={this._shouldCavaAppear}>
                {new _cava(this._values)}
            </box>
        );
    }
}
