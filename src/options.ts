import { OptionsPage } from './options-page';

const optionsPage = new OptionsPage({
  document,
  storage: chrome.storage.sync,
  getMessage: (messageName) => chrome.i18n.getMessage(messageName),
  commands: chrome.commands,
  tabs: chrome.tabs
});

void optionsPage.start();
