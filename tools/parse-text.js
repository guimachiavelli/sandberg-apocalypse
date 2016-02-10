/* jshint node: true */

'use strict';

const fs = require('fs');

const chunkLength = 10000;

function fragmentParsedContent(content, chunks) {
    chunks = chunks || [];

    if (content === '') {
        return chunks;
    }

    chunks.push(content.substr(1, chunkLength));
    content = content.substr(chunkLength);

    return fragmentParsedContent(content, chunks);
}

function writeParsedContent(unparsedContent) {
    let parsed = unparsedContent.replace(/\s/g, ' ').replace(/\s+/g, ' ');
    const chunks = fragmentParsedContent(parsed);

    chunks.forEach(function(chunk, i) {
        fs.writeFileSync(`./data/chunk-${i}.txt`, chunk);
    });
}

function main() {
    const args = process.argv.slice(2),
          partial = args.indexOf('--partial'),
          content = fs.readFileSync('./data/bible.txt', { encoding: 'utf8' });

    if (partial > -1) {
        writeParsedContent(content.substr(0, 50000));
        return;
    }

    writeParsedContent(content);
    return;
}

main();
