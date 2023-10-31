import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Box, Container, Typography, Collapse, Alert, FormControl, TextField, Button, Card, CardContent, CardActions } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

export default function Home() {
  const [loginInProgress, setLoginInProgress] = React.useState(false);
  const [loginFailedOnce, setLoginFailedOnce] = React.useState(false);
  const [boards, setBoards] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const defaultKey = '827826A9-567A-4B8C-896E-BCC857764543';
  const [key, setKey] = React.useState(defaultKey);
  const defaultBoardName = '';
  const [boardName, setBoardName] = React.useState(defaultBoardName);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorId, setEditorId] = React.useState('');
  const [editorName, setEditorName] = React.useState('');
  const [editorDesc, setEditorDesc] = React.useState('');
  const [editorParent, setEditorParent] = React.useState('');

  var apiPort = 3001;

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  function loginProc(e) {
    e.preventDefault();
    setLoginInProgress(true);
    let baseUrl = new URL(document.location.origin);
    baseUrl.port = apiPort;
    let endpoint = new URL('/login', baseUrl).href;
    axios.post(endpoint, {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    }).then(function (response) {
      let expires = new Date();
      expires.setTime(expires.getTime() + (3599 * 1000));
      Cookies.set('access_token', response.data.token, { expires: expires });
      location.reload();
    }).catch(function (error) {
      setLoginFailedOnce(true);
      setLoginInProgress(false);
    });
  };

  function getBoards(forKey) {
    setBusy(true);
    let baseUrl = new URL(document.location.origin);
    baseUrl.port = apiPort;
    let endpoint = new URL('/boards/' + forKey, baseUrl).href;
    axios.get(endpoint, {
      headers: {
        'X-Auth-Token': Cookies.get('access_token'),
      }
    }).then(function (response) {
      setBoards(response.data);
      setBusy(false);
    }).catch(function (error) {

    });
  };

  function deleteBoard(forKey, id, refreshKey) {
    setBusy(true);
    let baseUrl = new URL(document.location.origin);
    baseUrl.port = apiPort;
    let endpoint = new URL('/boards/' + forKey + '/' + id, baseUrl).href;
    axios.delete(endpoint, {
      headers: {
        'X-Auth-Token': Cookies.get('access_token'),
      },
    }).then(function (response) {
      getBoards(refreshKey);
    }).catch(function (error) {

    });
  };

  function updateBoard(forKey, id, name, desc, refreshKey) {
    setBusy(true);
    let baseUrl = new URL(document.location.origin);
    baseUrl.port = apiPort;
    let endpoint = new URL('/boards/' + forKey, baseUrl).href;
    axios.post(endpoint, {
      id: id,
      name: name,
      desc: desc,
    }, {
      headers: {
        'X-Auth-Token': Cookies.get('access_token'),
      },
    }).then(function (response) {
      getBoards(refreshKey);
    }).catch(function (error) {
    });
  };

  function openEditor(e) {
    setEditorId(e.target.dataset.id);
    setEditorName(e.target.dataset.name);
    setEditorDesc(e.target.dataset.desc);
    if (e.target.dataset.parent !== undefined) setEditorParent(e.target.dataset.parent);
    else setEditorParent(key);
    setEditorOpen(true);
  };

  //const access_token = document.cookie.split('; ').filter(row => row.startsWith('access_token=')).map(c=>c.split('=')[1])[0];
  const access_token = Cookies.get('access_token');
  if (access_token === undefined) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 4, '& .MuiTextField-root': { m: 1, width: '25ch' }, '& .MuiButton-root': { m: 1 }, }}>
          <Typography variant="h4" component="h1">
            Login
          </Typography>
          <Collapse in={loginFailedOnce}>
            <Alert severity="error">Invalid credentials</Alert>
          </Collapse>
          <form onSubmit={loginProc}>
            <FormControl>
              <TextField required id="username" label="Username" defaultValue="" variant="standard"/>
              <TextField required id="password" label="Password" defaultValue="" type="password" autoComplete="current-password" variant="standard"/>
            </FormControl>
            <br></br>
            <Button id="loginButton" variant="contained" type="submit" disabled={loginInProgress}>Login</Button>
          </form>
        </Box>
      </Container>
    );
  }
  React.useEffect(function() {
    //const queryParams = new URLSearchParams(location.search);
    //const queryKey = queryParams.get('key');
    //if (queryKey) setKey(queryKey);
    getBoards(key);
  }, []);
  return (
    <Container maxWidth="100%">
      <Modal open={editorOpen}>
        <Box sx={modalStyle}>
          <FormControl fullWidth>
            <TextField required id="editor_name" label="Name" defaultValue={editorName} variant="standard" onChange={ (e) => { setEditorName(e.target.value); }}/>
            <TextField multiline required id="editor_desc" label="Description" defaultValue={editorDesc} variant="standard" onChange={ (e) => { setEditorDesc(e.target.value); }}/>
          </FormControl>
          <Box>
            <Toolbar sx={{ px: '0 !important' }}>
              <Button variant="contained" sx={{ marginRight: '8px' }} onClick={(e) => {
                updateBoard(editorParent, editorId, editorName, editorDesc, key); 
                setEditorOpen(false); 
                }}>OK</Button>
              <Button variant="contained" sx={{ marginRight: '8px' }} onClick={(e) => { 
                setEditorOpen(false); 
                }}>Cancel</Button>
            </Toolbar>
          </Box>
        </Box>
      </Modal>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={busy}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" onClick={(e) => {
          if (key !== defaultKey) {
           setKey(defaultKey); setBoardName(defaultBoardName); getBoards(defaultKey);
          } 
        } } sx={{ cursor: 'pointer' }}>Collab Tool</Typography>
        <Box>
          <Toolbar sx={{ px: '0 !important' }}>
            {key == defaultKey && (
              <Button variant="contained" startIcon={<AddIcon />} data-name="New Board" data-desc="Board Description" onClick={(e) => { openEditor(e); /*updateBoard(key, undefined, "Untitled", "Untitled", key);*/ }}>New Board</Button>
            )}
            {key != defaultKey && (
              <Button variant="contained" startIcon={<AddIcon />} data-name="New Card List" data-desc="Card List Description" onClick={(e) => { openEditor(e); /*updateBoard(key, undefined, "Untitled", "Untitled", key);*/ }}>New Card List</Button>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>&nbsp;&nbsp;{boardName}</Typography>
          </Toolbar>
        </Box>
        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          {boards.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{textTransform: 'none'}} variant="outlined">
                <CardContent sx={{ paddingBottom: '0 !important'}}>
                  <Typography data-id={item._id} data-key={item.key} data-name={item.name} data-desc={item.desc} sx={{ cursor: 'pointer' }} gutterBottom variant="h5" component="div" onClick={(e) => { 
                    if (key == defaultKey) {
                      setKey(e.target.dataset.key);
                      setBoardName(e.target.dataset.name);
                      getBoards(e.target.dataset.key); 
                    } else openEditor(e);
                    }}>
                    {item.name}
                  </Typography>
                  <Typography data-id={item._id} data-key={item.key} data-name={item.name} data-desc={item.desc} gvariant="body2" color="text.secondary"><pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{item.desc}</pre></Typography>
                </CardContent>
                <CardActions sx={{ px: '16px !important' }}>
                  {key != defaultKey && (
                    <Button variant="contained" startIcon={<AddIcon />} data-parent={item.key} data-name="New Card" data-desc="Card Description" size="small" onClick={(e) => { openEditor(e); /*updateBoard(e.target.dataset.key, undefined, "Untitled", "Untitled", key);*/ }}>New Card</Button>
                  )}
                  <Button variant="contained" startIcon={<EditIcon />} data-id={item._id} data-key={item.key} data-name={item.name} data-desc={item.desc} size="small" onClick={(e) => { openEditor(e); }}>Edit</Button>
                  <Button variant="contained" sx={{ backgroundColor: '#d82f2f' }} startIcon={<DeleteIcon />} data-id={item._id} data-key={item.key} data-name={item.name} data-desc={item.desc} size="small" onClick={(e) => { deleteBoard(key, e.target.dataset.id, key); }}>Delete</Button>
                </CardActions>
                <Collapse in={ item.elems }>
                  {item.elems && item.elems.map((subitem, index) => (
                      <CardContent sx={{ paddingTop: '0 !important', paddingBottom: '4px !important', px: '4px !important'}}>                    
                        <Grid item key={index}>
                          <Card sx={{textTransform: 'none'}} variant="outlined">
                            <CardContent sx={{ paddingBottom: '0 !important'}}>
                              <Typography data-id={subitem._id} data-key={subitem.key} data-name={subitem.name} data-desc={subitem.desc} data-parent={item.key} sx={{ cursor: 'pointer' }} gutterBottom variant="h6" component="div" onClick={openEditor}>{subitem.name}</Typography> 
                              <Typography data-id={subitem._id} data-key={subitem.key} data-name={subitem.name} data-desc={subitem.desc} data-parent={item.key} gvariant="body2" color="text.secondary"><pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{subitem.desc}</pre></Typography> 
                            </CardContent>
                            <CardActions>
                              <Button variant="contained" startIcon={<EditIcon />} data-id={subitem._id} data-key={subitem.key} data-name={subitem.name} data-desc={subitem.desc} data-parent={item.key} size="small" onClick={(e) => { openEditor(e); }}>Edit</Button>
                              <Button variant="contained" sx={{ backgroundColor: '#d82f2f' }} startIcon={<DeleteIcon />} data-id={subitem._id} data-key={subitem.key} data-name={subitem.name} data-desc={subitem.desc} data-parent={item.key} size="small" onClick={(e) => { deleteBoard(e.target.dataset.parent, e.target.dataset.id, key); }}>Delete</Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      </CardContent>
                  ))}
                  <br></br>
                </Collapse>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
