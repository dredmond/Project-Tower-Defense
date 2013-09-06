function ResourceManager(type) {
    this.resources = new Array();
    this.total = 0;
    this.type = type;

    this.createResource = function(name, src) {

        var tmpResource = this.getResourceByName(name);

        if (tmpResource != null) {
            return tmpResource;
        }

        tmpResource = new Resource();
        tmpResource.name = name;
        tmpResource.type = this.type;

        if (this.type == ResourceType.Image) {
            tmpResource.value = new Image();
        } else if (this.type == ResourceType.Sound) {
            tmpResource.value = new Audio();
        }
        
        tmpResource.value.src = src;
        this.resources.push(tmpResource);
        
        return tmpResource.value;
    }

    this.getResourceByIndex = function(index) {
        if (index < this.resources.length) {
            return this.resources[index].value;
        } else {
            return null;
        }
    }

    this.getResourceByName = function(name) {
        for (var i = 0; i < this.resources.length; i++) {
            if (name == this.resources[i].name) {
                return this.resources[i].value;
            }
        }

        return null;
    }

    this.isFinishedLoading = function() {
        if (this.total < this.resources.length) {
            this.total = 0;

            // Recalculate Total
            this.loadingProgress();
        }

        if (this.total == this.resources.length) {
            return true;
        } else {
            return false;
        }
    }

    this.loadingProgress = function() {
        this.total = 0;

        for (var x in this.resources) {
            if (this.resources[x].type == ResourceType.Image && this.resources[x].value.complete) {
                this.total++;
            }
        }

        if (this.total < this.resources.length) {
            return ((this.total / this.resources.length) * 100).toFixed(2);
        } else {
            return parseFloat('100.00').toFixed(2);
        }
    }
}

var ResourceType = {Image: 0, Sound: 1}

function Resource() {
    this.name = "";
    this.value = null;
    this.type = -1;
}


