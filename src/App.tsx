import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';


import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FaDownload,
  FaTrashAlt,
  FaMoon,
  FaSun,
  FaSearch,
  FaCopy,
  FaProjectDiagram,
  FaInfoCircle,
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl,
  FaLink,
  FaCode,
  FaQuoteRight
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './App.css';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

// Markdown editing assistant
const MarkdownAssistant = ({ onInsert }) => {
  const tools = [
    { icon: <FaBold />, text: '**Bold**', description: 'Make text bold (Ctrl+B)' },
    { icon: <FaItalic />, text: '*Italic*', description: 'Make text italic (Ctrl+I)' },
    { icon: <FaListUl />, text: '- Bullet', description: 'Add bullet list' },
    { icon: <FaListOl />, text: '1. Numbered', description: 'Add numbered list' },
    { icon: <FaLink />, text: '[Text](url)', description: 'Add link (Ctrl+K)' },
    { icon: <FaCode />, text: '```\ncode\n```', description: 'Add code block' },
    { icon: <FaQuoteRight />, text: '> Quote', description: 'Add blockquote' },
  ];

  return (
    <div className="markdown-assistant">
      {tools.map((tool, index) => (
        <button
          key={index}
          className="tool-btn"
          onClick={() => onInsert(tool.text)}
          title={tool.description}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};

// Graph view for showing document connections
const GraphView = ({ markdownFiles }) => {
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    const processConnections = () => {
      const connections = markdownFiles.map(file => {
        const links = (file.content.match(/\[\[(.*?)\]\]/g) || []).length;
        return {
          name: file.title,
          connections: links,
        };
      });
      setGraphData(connections);
    };

    processConnections();
  }, [markdownFiles]);

  return (
    <div className="graph-view">
      <h2>Document Connections</h2>
      <LineChart width={600} height={300} data={graphData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="connections" stroke="#8884d8" />
      </LineChart>
    </div>
  );
};

// About modal component
const AboutModal = ({ onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>About 蜃気楼 Shinkiro (Mirage)</h2>
      <img 
        src="https://giffiles.alphacoders.com/220/220341.gif" 
        alt="Anime aesthetic" 
        className="anime-image" 
      />
      
      <p>
        蜃気楼-Shinkiro is a powerful Markdown editor. Some of its key features include:
      </p>
      
      <ul>
        <li>Real-time Markdown preview</li>
        <li>Graph view for document connections</li>
        <li>Dark mode support</li>
        <li>Markdown editing assistance</li>
        <li>Syntax highlighting</li>
        <li>File management</li>
      </ul>
      
      <div className="keyboard-shortcuts">
        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li>Ctrl+B: Bold text</li>
          <li>Ctrl+I: Italic text</li>
          <li>Ctrl+K: Insert link</li>
          <li>Ctrl+S: Save note</li>
        </ul>
      </div>
      
      <div className="modal-footer">
        <p>Made by: Saboten758 <a 
          href="https://github.com/Saboten758/shinkiro-frontend" 
          target="_blank" 
          rel="noopener noreferrer"
          className="github-link"
        >
          View on GitHub
        </a></p>
      </div>

      <button className="btn close-btn" onClick={onClose}>Close</button>
    </div>
  </div>
);

// Core application content (Markdown Manager)
const AppContent = () => {
  const [markdownFiles, setMarkdownFiles] = useState([]);
  const [newMarkdown, setNewMarkdown] = useState({ title: '', content: '' });
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showGraphView, setShowGraphView] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    fetchMarkdownFiles();
    
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    // Save dark mode preference
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchMarkdownFiles = async () => {
    try {
      const response = await axios.get('https://shinkiro-backend.vercel.app/api/markdown');
      setMarkdownFiles(response.data);
    } catch (error) {
      console.error('Error fetching markdown files', error);
    }
  };

  const handleChange = (e) => {
    setNewMarkdown({ ...newMarkdown, [e.target.name]: e.target.value });
  };

  const handleMarkdownAssist = (text) => {
    const textarea = document.querySelector('.textarea-field');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = newMarkdown.content;
    
    const newContent = 
      content.substring(0, start) +
      text +
      content.substring(end);
    
    setNewMarkdown({ ...newMarkdown, content: newContent });
    
    // Set focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleKeyboardShortcuts = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleMarkdownAssist('**Bold**');
          break;
        case 'i':
          e.preventDefault();
          handleMarkdownAssist('*Italic*');
          break;
        case 'k':
          e.preventDefault();
          handleMarkdownAssist('[](url)');
          break;
        case 's':
          e.preventDefault();
          handleSubmit(e);
          break;
        default:
          break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Delete the existing note before updating
        await axios.delete(`https://shinkiro-backend.vercel.app/api/markdown/${editingId}`);
        setEditingId(null);
      }
  
      // Create a new note with updated content
      await axios.post('https://shinkiro-backend.vercel.app/api/markdown', newMarkdown);
  
      // Reset the form
      setNewMarkdown({ title: '', content: '' });
  
      // Refresh notes list
      fetchMarkdownFiles();
    } catch (error) {
      console.error('Error submitting markdown', error);
    }
  };
  

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`https://shinkiro-backend.vercel.app/api/markdown/${id}`);
        setNewMarkdown({ title: '', content: '' });
        setEditingId(null);
        fetchMarkdownFiles();
      } catch (error) {
        console.error('Error deleting markdown', error);
      }
    }
  };

  const handleEdit = (markdown) => {
    setNewMarkdown({ title: markdown.title, content: markdown.content });
    setEditingId(markdown._id);
  };

  const handleDownload = (markdown) => {
    const element = document.createElement('a');
    const file = new Blob([markdown.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${markdown.title}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filteredFiles = markdownFiles.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="header">
        <h1>蜃気楼-Shinkiro (Mirage) - The Markdown Manager</h1>
        <div className="header-controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="btn icon-btn"
            onClick={() => setShowGraphView(!showGraphView)}
            title="Toggle Graph View"
          >
            <FaProjectDiagram />
          </button>
          <button 
            className="btn icon-btn"
            onClick={() => setShowAbout(true)}
            title="About"
          >
            <FaInfoCircle />
          </button>
          <button 
            className="toggle-dark-mode" 
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          {/* Displays a user dropdown button for account management */}
          <UserButton />
        </div>
      </div>

      <div className="main-content">
        {showGraphView && (
          <div className="graph-container">
            <GraphView markdownFiles={markdownFiles} />
          </div>
        )}
        
        <div className="sidebar">
          <button 
            className="btn new-note-btn" 
            onClick={() => {
              setNewMarkdown({ title: '', content: '' });
              setEditingId(null);
            }}
          >
            + New Note
          </button>
          <div className="notes-list">
            {filteredFiles.map(markdown => (
              <div 
                key={markdown._id} 
                className={`note-item ${editingId === markdown._id ? 'active' : ''}`}
                onClick={() => handleEdit(markdown)}
              >
                <h3>{markdown.title}</h3>
                <p>{markdown.content.substring(0, 50)}...</p>
              </div>
            ))}
          </div>
        </div>

        <div className="editor-container">
          <div className="markdown-preview">
            <h2>Preview: {newMarkdown.title && <>{newMarkdown.title}</>}</h2>
            
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return inline ? (
                    <code {...props}>{children}</code>
                  ) : (
                    <div className="code-block-container">
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                      >
                        <FaCopy />
                      </button>
                      <SyntaxHighlighter
                        style={solarizedlight}
                        language={match ? match[1] : 'text'}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
              }}
            >
              {newMarkdown.content}
            </ReactMarkdown>
          </div>

          <form onSubmit={handleSubmit} className="markdown-form">
            <h4 style={{color:"#d580ff"}}>Editor</h4>
            <input
              type="text"
              name="title"
              value={newMarkdown.title}
              onChange={handleChange}
              placeholder="Note title"
              required
              className="input-field"
            />
            <MarkdownAssistant onInsert={handleMarkdownAssist} />
            <textarea
              name="content"
              value={newMarkdown.content}
              onChange={handleChange}
              onKeyDown={handleKeyboardShortcuts}
              placeholder="Start writing your markdown here... Use [[ ]] for internal links"
              required
              className="textarea-field"
            />
            
            <div className="button-row">
              <button type="submit" className="btn save-btn">
                {editingId ? 'Update Note' : 'Create Note'}
              </button>
              {editingId && (
                <>
                  <button 
                    type="button" 
                    className="btn delete-btn"
                    onClick={() => handleDelete(editingId)}
                  >
                    <FaTrashAlt /> Delete
                  </button>
                  <button 
                    type="button" 
                    className="btn download-btn"
                    onClick={() => handleDownload(newMarkdown)}
                  >
                    <FaDownload /> Download
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
};

// Main App component with Clerk authentication wrappers
const App = () => {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
      <AppContent />
      </SignedIn>
    </header>
  );
};

export default App;
