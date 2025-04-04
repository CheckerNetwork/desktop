# Installing Webfonts
Follow these simple Steps.

## 1.
Put `clash-display/` Folder into a Folder called `fonts/`.

## 2.
Put `clash-display.css` into your `css/` Folder.

## 3. (Optional)
You may adapt the `url('path')` in `clash-display.css` depends on your Website Filesystem.

## 4.
Import `clash-display.css` at the top of you main Stylesheet.

```
@import url('clash-display.css');
```

## 5.
You are now ready to use the following Rules in your CSS to specify each Font Style:
```
font-family: ClashDisplay-Extralight;
font-family: ClashDisplay-Light;
font-family: ClashDisplay-Regular;
font-family: ClashDisplay-Medium;
font-family: ClashDisplay-Semibold;
font-family: ClashDisplay-Bold;
font-family: ClashDisplay-Variable;

```
## 6. (Optional)
Use `font-variation-settings` rule to controll axes of variable fonts:
wght 700.0

Available axes:
'wght' (range from 200.0 to 700.0

