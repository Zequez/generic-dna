import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { encodeHashToBase64, type HoloHash } from '@holochain/client';

import './post-detail';

import { simpleHolochainContext } from '../contexts';
import {
  AsyncStatus,
  NodeId,
  NodeIdAndTag,
  NodeStoreContent,
  SimpleHolochain,
} from '@holochain/simple-holochain';

@customElement('all-posts')
export class AllPosts extends LitElement {
  @consume({ context: simpleHolochainContext })
  simpleHolochain!: SimpleHolochain;

  @state()
  nodeContent: AsyncStatus<NodeStoreContent> = { status: 'pending' };

  @state()
  nodeStoreUnsubscriber: (() => void) | undefined;

  firstUpdated() {
    this.nodeStoreUnsubscriber = this.simpleHolochain.subscribeToNode(
      {
        type: 'Anchor',
        id: 'ALL_POSTS',
      },
      async status => {
        this.nodeContent = status;
        if (status.status === 'complete') {
          const originalThingsIds = status.value.linkedNodeIds.map(
            n => n.node_id.id
          ) as HoloHash[];
          const latestThings = await this.simpleHolochain.getThings(
            originalThingsIds
          );
          console.log(
            originalThingsIds.map(encodeHashToBase64),
            latestThings.filter(t => t).map(t => encodeHashToBase64(t!.id))
          );
          console.log(
            'ALL_POSTS',
            JSON.stringify(
              status.value.linkedNodeIds.map(n => [
                encodeHashToBase64(n.node_id.id as HoloHash),
                n.tag,
              ])
            )
          );
        }
        this.requestUpdate();
      }
    );
  }

  disconnectedCallback(): void {
    if (this.nodeStoreUnsubscriber) this.nodeStoreUnsubscriber();
  }

  renderNodes(nodeIdAndMetas: NodeIdAndTag[]) {
    const thingNodes = nodeIdAndMetas.filter(
      idAndMeta => idAndMeta.node_id.type === 'Thing'
    );
    console.log('Rendering thingNodes: ', thingNodes);
    return thingNodes.map(
      idAndMeta =>
        html` <post-detail .thingHash=${idAndMeta.node_id.id}></post-detail> `
    );
  }

  render() {
    if (this.nodeContent.status === 'error')
      return html`<div class="alert">
        Error fetching the thing: ${this.nodeContent.error}
      </div>`;
    if (this.nodeContent.status === 'pending')
      return html`<progress></progress>`;
    return this.renderNodes(this.nodeContent.value.linkedNodeIds);
  }
}
