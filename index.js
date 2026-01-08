import express from 'express';
import sql from 'mssql';
import 'dotenv/config';


const app = express();
app.use(express.json());

console.log('ENV DB_HOST:', process.env.DB_HOST);
console.log('ENV DB_PORT:', process.env.DB_PORT);
console.log('ENV DB_NAME:', process.env.DB_NAME);
console.log('ENV DB_USER:', process.env.DB_USER);


const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// --- Health check ---
app.get('/health', async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const r = await pool.request().query(
      "SELECT @@SERVERNAME AS server, DB_NAME() AS db"
    );
    res.json(r.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Obtener XML ---
app.get('/xml/:folio', async (req, res) => {
  try {
    const folio = parseInt(req.params.folio);

    const pool = await sql.connect(sqlConfig);
    const r = await pool.request()
      .input('folio', sql.Int, folio)
      .query(`
        SELECT TOP 1
          CONVERT(VARCHAR(MAX), cxml) AS cxml
        FROM dbo.admSecudoc
        WHERE cfolio = @folio
      `);

    if (r.recordset.length === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    res.json({
      folio,
      cxml: r.recordset[0].cxml
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
});



