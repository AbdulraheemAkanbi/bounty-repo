import { useEffect,useState } from "react";
import * as XLSX from 'xlsx';
import "./App.css"
import bootstrap from 'bootstrap'
function App() {
  // onchange states
  const [excelFile, setExcelFile] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [tableName, setTableName] = useState("");
  const [prompt, setPrompt] = useState('');
  const [tables, setTables] = useState([]);

  // submit state
  const [excelData, setExcelData] = useState(null);
  
  useEffect(() => {
    fetch('http://localhost:3300/tables')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
      .then(data => {
        console.log('Text:', data);
        setTables(data);
      })
      .catch(error => {
        console.error('Error fetching tables:', error);
      });
  }, []);

  // Handle prompt input change
const handlePromptChange = (e) => {
  setPrompt(e.target.value);
}

// Handle prompt submit
const handlePromptSubmit = () => {
  fetch(`http://localhost:3300/runPrompt/${tableName}?prompt=${prompt}`, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
      },
  })
      .then(response => response.json())
      .then(data => {
          console.log('Prompt result:', data);
          // Handle prompt result as needed
      })
      .catch(error => {
          console.error('Error running prompt:', error);
      });
}


  // onchange event 
  const handleFile=(e)=>{
    let fileTypes = ['application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv'];
    let selectedFile = e.target.files[0];
    if(selectedFile){
      if(selectedFile&&fileTypes.includes(selectedFile.type)){
        setTypeError(null);
        let reader = new FileReader();
        reader.readAsArrayBuffer(selectedFile);
        reader.onload=(e)=>{
          setExcelFile(e.target.result);
        }
      }
      else{
        setTypeError('Please select only excel or csv file types');
        setExcelFile(null);
      }
    }
    else{
      console.log('Please select your file');
    }
  }
  
  // submit event
  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (excelFile !== null && tableName !== "") {
        const workbook = XLSX.read(excelFile, { type: 'buffer' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        fetch('http://localhost:3300/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data,
                tableName,
            }),
        })
            .then(response => response.text())
            .then(result => {
                console.log(result);
                setExcelData(data.slice(0, 10));
            })
            .catch(error => {
                console.error('Error:', error);
            });
    } else {
        console.log('Please select a table name and file');
    }
}

  // handle table name change
  const handleTableNameChange = (e) => {
    setTableName(e.target.value);
  }

  return (
    <div className="wrapper">
    <div className="title_header"> <h1>Upload & View  Excel or .CSV Files</h1></div>
      
    <form className="form-group custom-form" onSubmit={handleFileSubmit}>
  <div className="input-group input-group-lg">
    <input type="file" name="file"  className="form-control" required onChange={handleFile} />
    <div className="icon"> 
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16" className="icon">
  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
</svg>
<p> Browse .csv or .xlsx file to upload </p>

    </div>
    <select className="form-control" value={tableName} onChange={handleTableNameChange}>
      <option value="">Select Table Name</option>
      {tables.map((table, index) => (
        <option key={index} value={table}>{table}</option>
      ))}
    </select>
    <button type="submit" className="btn btn-success btn-md" disabled={!tableName}>UPLOAD</button>
  </div>
  {typeError && (
    <div className="alert alert-danger" role="alert">{typeError}</div>
  )}

<input type="text" className="form-control" placeholder="Enter prompt..." value={prompt} onChange={handlePromptChange} />
<button type="button" className="btn btn-primary" onClick={handlePromptSubmit}>Run Prompt</button>
</form>


     

      {/* view data */}
      <div className="viewer">
        {excelData?(
          <div className="table-responsive">
            <table className="table">

            <thead>
  <tr>
    {excelData && Object.keys(excelData[0]).map((key) => (
      <th key={key}>{key}</th>
    ))}
  </tr>
</thead>


              <tbody>
                {excelData.map((individualExcelData, index)=>(
                  <tr key={index}>
                    {Object.keys(individualExcelData).map((key)=>(
                      <td key={key}>{individualExcelData[key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        ):(
          <div>No File is uploaded yet!</div>
        )}
      </div>

    </div>
  );
}

export default App;