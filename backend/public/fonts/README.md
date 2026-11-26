# Font Directory

This directory is for custom fonts used by the application.

## Required Fonts

For the PDF service to use Roboto fonts, place the following files in this directory:

- Roboto-Regular.ttf
- Roboto-Bold.ttf

You can download these fonts from Google Fonts: https://fonts.google.com/specimen/Roboto

## Usage

The PDF service will automatically detect and use these fonts if they are present.
If the fonts are not available, the service will fall back to the built-in fonts
provided by PDFKit (Helvetica, Times-Roman, Courier).
