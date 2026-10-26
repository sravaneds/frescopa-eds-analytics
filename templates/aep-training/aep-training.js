import { initEager } from '../../scripts/aep/index.js';

/**
 * AEP training template: runs the eager part of the analytics & personalization
 * runtime before the first section is loaded.
 * @param {Document} doc the document
 */
export default function decorate(doc) {
  const main = doc.querySelector('main');
  if (main) initEager(main);
}
