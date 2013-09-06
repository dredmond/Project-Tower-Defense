function ControlBase() {
    this.x = 0;
    this.y = 0;
    this.h = 0;
    this.w = 0;
    this.name = '';
    this.visible = true;
    this.disabled = false;
    this.parent = null;
    this.hasFocus = false;
    this.onClick = function () {}
    this.draw = function () {}

    this.click = function(x, y) {
        if (!this.visible)
            return false;

        if (this.onClick != null && this.inBounds(x, y)) {
            // Button disabled so don't call onClick
            if (this.disabled || this.parent.disabled)
                return true;

            this.onClick(this);
            return true;
        }

        return false;
    }

    this.inBounds = function (x, y) {
        if ((x >= this.parent.x + this.x) && (x <= (this.parent.x + this.x + this.w)) &&
            (y >= this.parent.y + this.y) && (y <= (this.parent.y + this.y + this.h))) {
            return true;
        }
        else {
            return false;
        }
    }
}

Button = function() {
    this.selected = false;
    this.selectedImage = null;
    this.unselectedImage = null;
    this.text = '';
    this.font = '10px Arial';
    this.color = '#000000';
    this.selectedColor = '#FFFFFF';
}

Button.prototype = new ControlBase();
Button.prototype.draw = function (context2D) {
    if (!this.visible)
        return;

    if (this.selected || this.disabled || this.parent.disabled || this.hasFocus) {
            context2D.drawImage(this.selectedImage, this.parent.x + this.x, this.parent.y + this.y);
    } else {
            context2D.drawImage(this.unselectedImage, this.parent.x + this.x, this.parent.y + this.y);
    }

    if (this.hasFocus && !this.disabled && !this.parent.disabled) {
        context2D.fillStyle = this.selectedColor;
    } else {
        context2D.fillStyle = this.color;
    }

    context2D.font = this.font;
    context2D.fillText(this.text, this.parent.x + this.x + 5, this.parent.y + this.y + 24);
}
Button.prototype.init = function (parent, name, x, y, w, h) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.parent = parent;
}

Label = function() {
    this.text = '';
    this.font = '10px Arial';
    this.color = '#000000'
}

Label.prototype = new ControlBase();
Label.prototype.init = function (parent, name, text, x, y) {
    this.text = text;
    this.parent = parent;
    this.name = name;
    this.x = x;
    this.y = y;
    this.h = 0;
    this.w = 0;
}
Label.prototype.draw = function (context2D) {
    if (!this.visible)
        return;

    context2D.font = this.font;
    context2D.fillStyle = this.color;
    context2D.fillText(this.text, this.parent.x + this.x, this.parent.y + this.y);
}

var Menu = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    controls: null,
    disabled: false,

    init: function (x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.controls = new Array();
    },

    addControl: function (control) {
        this.controls.push(control);
    },

    findControl: function (name) {
        for (var i = 0; i < this.controls.length; i++) {
            if (this.controls[i].name === name) {
                return this.controls[i];
            }
        }

        return null;
    },

    removeControl: function (control) {
        for (var i = 0; i < this.controls.length; i++) {
            if (this.controls[i] === control) {
                this.controls.splice(i, 1);
                break;
            }
        }
    },

    click: function (x, y) {
        var handled = false;

        if (!this.inBounds(x, y))
            return handled;

        for (var i = 0; i < this.controls.length && !handled; i++) {
            handled = this.controls[i].click(x, y);
        }

        if (!handled) {
            // Message was for the menu itself.
            handled = true;
        }

        return handled;
    },

    mouseMove: function (x, y) {
        var focusSet = false;

        if (this.inBounds(x, y) && !this.disabled) {
            for (var i = 0; i < this.controls.length; i++) {
                if (this.controls[i].inBounds(x, y) && this.controls[i].visible && !focusSet) {
                    this.controls[i].hasFocus = true;
                    focusSet = true;
                } else {
                    this.controls[i].hasFocus = false;
                }
            }
        }
    },

    inBounds: function (x, y) {
        if ((x >= this.x) && (x <= (this.x + this.width)) &&
            (y >= this.y) && (y <= (this.y + this.height))) {
            return true;
        }
        else {
            return false;
        }
    },

    draw: function(context2D) {
        context2D.fillStyle = '#cccccc';
        context2D.fillRect(this.x, this.y, this.width, this.height);

        for (var i = 0; i < this.controls.length; i++) {
            this.controls[i].draw(context2D);
        }
    }
}