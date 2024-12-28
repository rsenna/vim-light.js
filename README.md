---
created: 2024-12-28T14:24:19+01:00
updated: 2024-12-28T15:28:54+01:00
---
# vim-light-js

> ℹ️ This is a **fork** of an original, currently unmaintained work
>
> Library:  [Vim.js](https://github.com/toplan/Vim.js)
> Author: [Top Lan](https://github.com/toplan).
>
> This fork aims to maintain and improve upon the original library, bringing it
> up to speed with modern JavaScript standards and browsers.

`vim-light.js` aims to be a simple library that brings Vim-like editing
capabilities to `textarea` and `input type="text"` web fields.

---

## Introduction

`vim-light.js` provides a lightweight and intuitive Vim-inspired editing mode
for `textarea` and `input` fields, which might enhance the user experience
for Vim users on the web

> **Note:**
>
> - This library is definitely **not** designed to replace web-based IDEs!
>   It focuses on simple, text-only, online embedded use cases, where Vim-like
>   keybindings might be desirable.
> - The library is under development, and new features or improvements _will_
>   be added over time.
> - Use Vim shortcuts with the **American Keyboard Layout** for optimal
>   functionality.

---

## Usage

### Basic Example

```html
<script src="/path/to/vim-light.js"></script>
<script type="text/javascript">
    vim.open({
        debug: true,
        showMsg: function (msg) {
            alert('vim-light.js says: ' + msg);
        }
    });
</script>
```

Note: `vim-light.js` is lightweight (currently about 20 KiB).

### Development and Build Instructions

```bash
# Install Dependencies
npm install vim-light.js

# Development Mode (with file watcher)
npm run dev

# Build
npm run build

# Build Minified JS File
npm run build_min
```

### Browser Support

Tested on the following browsers:  

- **Chrome** (v39 and newer)  
- **Firefox** (v34, v40 and newer)  
- **Safari**  

---

## Features

`vim-light.js` supports 3 modes:

1. [Normal Mode](#normal-mode)
2. [Insert Mode](#insert-mode)
3. [Visual Mode](#visual-mode)

### <a name="normal-mode"/>Normal Mode

| Command               | Description                         |
| --------------------- | ----------------------------------- |
| **Cursor Navigation** |                                     |
| `h` or `←`            | Move left one char                  |
| `j` or `↓`            | Move down one line                  |
| `k` or `↑`            | Move up one line                    |
| `l` or `→`            | Move right one char                 |
| `0` or `[Home]`       | Move to the beginning of the line   |
| `$` or `[End]`        | Move to the end of the line         |
| `G`                   | Move to the end of the text         |
| `gg`                  | Move to the first line              |
| `w` or `W`            | Move to the beginning of next word  |
| `nw` or `nW`          | Move `n` words forward              |
| **Copy**              |                                     |
| `yy`                  | Copy the current line               |
| `nyy`                 | Copy `n` lines                      |
| `yw`                  | Copy one word                       |
| `nyw`                 | Copy `n` words                      |
| **Destructive**       |                                     |
| `x` or `[Delete]`     | Delete a single char                |
| `nx` or `n[Delete]`   | Delete `n` chars                    |
| `dd`                  | Delete the current line             |
| `ndd`                 | Delete `n` lines                    |
| `dw`                  | Delete one word                     |
| `ndw`                 | Delete `n` words                    |
| `p`                   | Paste after the cursor              |
| `P`                   | Paste before the cursor             |
| `r`                   | Replace a single char               |
| **Change Modes**      |                                     |
| _into Edit Mode_      |                                     |
| `i`                   | Insert before the cursor            |
| `I`                   | Insert at the beginning of the line |
| `a`                   | Append after the cursor             |
| `A`                   | Append at the end of the line       |
| `o`                   | Open a new line below               |
| `O`                   | Open a new line above               |
| _into Visual Mode_    |                                     |
| `v` / `V`             | Enter Visual Mode                   |

### <a name="insert-mode"/>Insert Mode

| Command | Description                             |
| ------- | --------------------------------------- |
| `Esc`   | Switch to Normal Mode                   |
| &nbsp;  | Any other char will be inserted as such |

### <a name="visual-mode"/>Visual Mode

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| **Cursor Selection** |                                                  |
| `h` or `←`           | Change _selection_ left one char                 |
| `j` or `↓`           | Change _selection_ down one line                 |
| `k` or `↑`           | Change _selection_ up one line                   |
| `l` or `→`           | Change _selection_ right one char                |
| `0` or `[Home]`      | Change _selection_ to the beginning of the line  |
| `$` or `[End]`       | Change _selection_ to the end of the line        |
| `G`                  | Change _selection_ to the end of the text        |
| `gg`                 | Change _selection_ to the first line             |
| `w` or `W`           | Change _selection_ to the beginning of next word |
| `nw` or `nW`         | Change _selection_ `n` words forward             |
| **Copy**             |                                                  |
| `y`                  | Copy selection                                   |
| **Destructive**      |                                                  |
| `x`, `d`, `[Delete]` | Delete selection                                 |
| `p`                  | Paste after the cursor                           |
| `P`                  | Paste before the cursor                          |
| `r`                  | Replace selection                                |
| **Change Modes**     |                                                  |
| `Esc`                | Switch to Normal Mode                            |

---

## Contributing

If you'd like to contribute to this repo, feel free to submit pull requests or
report issues.
