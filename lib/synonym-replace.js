'use babel';

import { CompositeDisposable, Notifications } from 'atom';
import SynonymReplaceView from './synonym-replace-view';

const AskForSelectionView = require('./AskForSelectionView');

export default {

  synonymReplaceView: null,
  subscriptions: null,

  activate(state) {
    this.synonymReplaceView = new SynonymReplaceView(state.synonymReplaceViewState);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that fetchs this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'synonym-replace:fetch': () => this.fetch()
    }));

    this.fetch();
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {
      synonymReplaceViewState: this.synonymReplaceView.serialize()
    };
  },

  fetch() {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      const selection = editor.getSelectedText()
      if(selection.search(" ") == -1) {
        const thesaurus = require('saurus');
        thesaurus(selection).then(function(matches) {
          const askView = new AskForSelectionView();
          askView.setItems(matches.synonyms);
          askView.show();

          // Wait for user selection
          askView.deferred
          .then((replacement) => {
            editor.insertText(replacement)
          })
          // Selection was cancelled, so let's just move on.
          .catch(() => {})
          .then(() => {
            askView.destroy();
          });
        });
      } else {
        atom.notifications.addError("Synonym lookup only works for single words.")
      }
    }
  }
};
