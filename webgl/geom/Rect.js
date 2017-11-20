function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.prototype.set = function(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

Rect.prototype.contains = function(point) {
  return point.x >= this.x && point.x <= this.x + this.width && point.y >= this.y && point.y <= this.y + this.height;
};

Rect.prototype.scaleToFit = function(targetRect) {
  var scale = Math.min(targetRect.width / this.width, targetRect.height / this.height);

  return new Rect(
    targetRect.x + (targetRect.width - scale * this.width)/2,
    targetRect.y + (targetRect.height - scale * this.height)/2,
    scale * this.width,
    scale * this.height
  );
}

Rect.prototype.scaleToFill = function(targetRect) {
  var scale = Math.max(targetRect.width / this.width, targetRect.height / this.height);

  return new Rect(
    targetRect.x + (targetRect.width - scale * this.width)/2,
    targetRect.y + (targetRect.height - scale * this.height)/2,
    scale * this.width,
    scale * this.height
  );
}

module.exports = Rect;