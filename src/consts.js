// TODO: move common constants elsewhere
export const ENTER = '\n';
export const ENTER_REGEXP = /\n/;

export const charRegEx1 = /[\w\u4e00-\u9fa5]/;
export const charRegEx2 = /[^|]/;

export const symbolRegEx1 = /\W/;
export const symbolRegEx2 = /\S/;

export const findSymbolChar = /[^\w\u4e00-\u9fa5]/;
export const findGeneralChar = /[\w\u4e00-\u9fa5]/;

export const GENERAL = 'general_mode';
export const EDIT = 'edit_mode';
export const VISUAL = 'visual_mode';
export const COMMAND = 'command_mode'; // TODO: unused?

export const ERROR_MESSAGE = 'Execution failure! Please use the #vim instructions in the English input method.';
