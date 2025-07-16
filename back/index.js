const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { removeBackground } = require('@imgly/background-removal-node');

const app = express();
app.use(cors());

// Configure multer to store uploads in `uploads/`
const upload = multer({ dest: 'uploads/' });

app.post('/api/remove-bg', upload.single('file'), async (req, res) => {
  try {
    const imgPath = req.file.path;
    const blob = await removeBackground(imgPath);
    const buf = Buffer.from(await blob.arrayBuffer());

    res.type('png').send(buf);
  } catch (err) {
    console.error('BG removal error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    // Clean up the temp file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete temp file:', unlinkErr);
      });
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
