# vim-light-js

> ℹ️ This is a *cough* *cough* **blatant copy** of an original, currently unmaintained work:
>
> Library:  [Vim.js](https://github.com/toplan/Vim.js)</br>
> Author: [Top Lan](https://github.com/toplan).
>
> My original intention was to improve upon the forked library.
> And it was a nice exercise, but ultimately I don't think it's worth continuing.
>
> After all, there are plenty of great alternatives, such as [Code Mirror](https://codemirror.net/)
> (not exactly *light*, but nevertheless very good), or [Ace Editor](https://ace.c9.io/)
> (which is also very good, and by the way is used by [Surfinkeys](https://github.com/brookhong/Surfingkeys), arguably the *best* Vim-like plugin for both Chrome and Firefox.)
>
> Which means, there's no nead for yet-another vim-like editor library for JavaScript...

`vim-light.js` is simple library, providing Vim-like editing
capabilities to `textarea` and `input type="text"` web fields.

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

### Development and Build Instructions

```bash
# Install Dependencies
npm install

# Development Mode (with file watcher)
npm run dev

# Build
npm run build

# Build Minified JS File
npm run build-min
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
