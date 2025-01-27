import {
  ActionHash,
  HolochainError,
  Record,
  encodeHashToBase64,
  decodeHashFromBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { decode } from '@msgpack/msgpack';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { simpleHolochainContext } from '../contexts';
import { Thing } from '@holochain/simple-holochain';
import { SimpleHolochain } from '@holochain/simple-holochain';

@customElement('edit-post')
export class EditPost extends LitElement {
  @consume({ context: simpleHolochainContext })
  client!: SimpleHolochain;

  @property({
    hasChanged: (newVal: ActionHash, oldVal: ActionHash) =>
      newVal?.toString() !== oldVal?.toString(),
  })
  originalThingHash!: ActionHash;

  @property()
  thing!: Thing;

  // get currentThing() {
  //   return decode((this.currentRecord.entry as any).Present.entry) as Thing;
  // }

  @state()
  _content!: string;

  isThingValid() {
    return true && this._content !== '';
  }

  connectedCallback() {
    super.connectedCallback();
    // if (!this.currentRecord) {
    //   throw new Error(`The currentRecord property is required for the edit-thing element`);
    // }

    // if (!this.originalThingHash) {
    //   throw new Error(`The originalThingHash property is required for the edit-thing element`);
    // }

    this._content = this.thing.content;
  }

  async firstUpdated(props: any) {
    super.firstUpdated(props);
    const id = this.thing.id;
    // @ts-ignore
    const originalThing = (await this.client.callZome(
      'get_all_revisions_for_thing',
      id
    )) as Thing[];
    console.log('uhCkkVDTX2YR315ljZ9YDabVg-mt2UlVdCesr0MjrsilA7VEr1Yn1');
    console.log(originalThing.map(o => [o.content, encodeHashToBase64(o.id)]));
    // this.originalThingHash = id;
  }

  async updatePost() {
    try {
      // await this.client.getThing;
      console.log('Updating thing!');
      const updated = await this.client.updateThing(
        this.originalThingHash,
        this._content
      );
      console.log(updated);
      this.dispatchEvent(
        new CustomEvent('thing-updated', {
          bubbles: true,
          composed: true,
        })
      );
    } catch (e) {
      alert((e as HolochainError).message);
    }
  }

  render() {
    return html`
      <div style="text-align: right; font-family: monospace">
        <div>
          <strong>OriginalThing:</strong> ${encodeHashToBase64(
            this.originalThingHash
          )}
        </div>
        <div>
          <strong>ThingID:</strong> ${encodeHashToBase64(this.thing.id)}
        </div>
      </div>
      <section>
        <div>
          <label for="Content">Content</label>
          <input
            name="Content"
            .value=${this._content}
            @input=${(e: CustomEvent) => {
              this._content = (e.target as any).value;
            }}
            required
          />
        </div>

        <div>
          <button
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('edit-canceled', {
                  bubbles: true,
                  composed: true,
                })
              )}
          >
            Cancel
          </button>
          <button
            .disabled=${!this.isThingValid()}
            @click=${() => this.updatePost()}
          >
            Save
          </button>
        </div>
      </section>
    `;
  }
}
