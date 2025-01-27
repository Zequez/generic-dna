import {
  ActionHash,
  HolochainError,
  encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import './edit-post';

import { simpleHolochainContext } from '../contexts';
import {
  AsyncStatus,
  LinkDirection,
  NodeStoreContent,
  SimpleHolochain,
  Thing,
} from '@holochain/simple-holochain';

@customElement('post-detail')
export class PostDetail extends LitElement {
  @consume({ context: simpleHolochainContext })
  simpleHolochain!: SimpleHolochain;

  @property({
    hasChanged: (newVal: ActionHash, oldVal: ActionHash) =>
      newVal?.toString() !== oldVal?.toString(),
  })
  thingHash!: ActionHash;

  @state()
  _editing = false;

  @state()
  nodeContent: AsyncStatus<NodeStoreContent> = { status: 'pending' };

  @state()
  nodeStoreUnsubscriber: (() => void) | undefined;

  firstUpdated() {
    if (!this.thingHash) {
      throw new Error(
        `The thingHash property is required for the thing-detail element`
      );
    }
    this.nodeStoreUnsubscriber = this.simpleHolochain.subscribeToNode(
      {
        type: 'Thing',
        id: this.thingHash,
      },
      val => {
        console.log('@post-detail: Got new value: ', val);
        this.nodeContent = val;
      }
    );
  }

  disconnectedCallback(): void {
    if (this.nodeStoreUnsubscriber) this.nodeStoreUnsubscriber();
  }

  async deleteThing() {
    try {
      await this.simpleHolochain.deleteThing(this.thingHash, true, true, [
        {
          direction: LinkDirection.From,
          node_id: {
            type: 'Anchor',
            id: 'ALL_POSTS',
          },
        },
      ]);
    } catch (e) {
      console.error((e as HolochainError).message);
      alert((e as HolochainError).message);
    }
  }

  renderDetail(thing: Thing) {
    return html`
      <div style="text-align: right; font-family: monospace">
        <div>
          <strong>ThingHash:</strong> ${encodeHashToBase64(this.thingHash)}
        </div>
        <div><strong>ThingID:</strong> ${encodeHashToBase64(thing.id)}</div>
      </div>
      <section>
        <div>
          <span><strong>Content: </strong></span>
          <span>${thing.content}</span>
        </div>

        <div>
          <button
            @click=${() => {
              this._editing = true;
            }}
          >
            edit
          </button>
          <button @click=${() => this.deleteThing()}>delete</button>
        </div>
      </section>
    `;
  }

  render() {
    if (this.nodeContent.status === 'error') {
      return html`<div class="alert">
        Error fetching the Thing: ${this.nodeContent.error}
      </div>`;
    } else if (this.nodeContent.status === 'pending') {
      return html`<progress></progress>`;
    } else if (this.nodeContent.status === 'complete') {
      const thing = this.nodeContent.value.content.content as Thing;

      if (this._editing) {
        return html`
          <edit-post
            .originalThingHash=${this.thingHash}
            .thing=${thing}
            @thing-updated=${async () => {
              this._editing = false;
            }}
            @edit-canceled=${() => {
              this._editing = false;
            }}
          ></edit-post>
        `;
      } else {
        return this.renderDetail(thing);
      }
    }
  }
}
