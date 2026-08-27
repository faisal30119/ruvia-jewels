import Cocoa
import CoreGraphics

let inputPath = "public/images/ruvia-logo.jpg"
let outputPath = "public/images/ruvia-logo-circle.png"

guard let image = NSImage(contentsOfFile: inputPath) else { exit(1) }
let size = NSSize(width: 512, height: 512)
let newImage = NSImage(size: size)

newImage.lockFocus()
let ctx = NSGraphicsContext.current?.cgContext
let rect = CGRect(origin: .zero, size: size)

// Create circular path clipping
ctx?.addEllipse(in: rect)
ctx?.clip()

image.draw(in: rect, from: .zero, operation: .copy, fraction: 1.0)
newImage.unlockFocus()

if let tiffData = newImage.tiffRepresentation,
   let bitmapImage = NSBitmapImageRep(data: tiffData),
   let pngData = bitmapImage.representation(using: .png, properties: [:]) {
    try? pngData.write(to: URL(fileURLWithPath: outputPath))
    print("Successfully created circular logo PNG!")
}
