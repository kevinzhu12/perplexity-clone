"use client";

import { useState, useEffect } from "react";
import { searchExaContents } from "./actions/exa-actions";
import { getChatCompletion } from "./actions/openai-actions";
import ReactMarkdown from "react-markdown";

interface SavedSearch {
  query: string;
  results: any;
  summary: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );

  useEffect(() => {
    const saved = localStorage.getItem("savedSearches");
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSearchResults(null);
    setSummary(null);
    setIsSaved(false); // Reset the isSaved state for new searches
    try {
      const results = await searchExaContents(searchQuery);
      setSearchResults(results);

      const topResults = results.results
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5);

      const combinedText = topResults
        .map((result: any) => result.text)
        .join("\n\n");

      const summaryPrompt = `
        The user asked the following question: "${searchQuery}"

        Based on this question, summarize the following information in a structured format:

        ${combinedText}

        Please format your response as follows:
        - Begin with a direct answer to the user's question.
        - Use double line breaks to separate main sections.
        - Start each section with a title on its own line.
        - Use **bold** for important points.
        - Use *italic* for emphasis.
        - Use - at the start of a line for list items.
        - Aim for 3-4 main sections in your summary.
        - Ensure that your summary is focused on answering the user's original question.
      `;
      const summaryResult = await getChatCompletion(summaryPrompt);
      setSummary(summaryResult.content);
    } catch (error) {
      console.error("Error performing search or generating summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearch = () => {
    if (searchQuery && searchResults && summary && !isSaved) {
      const newSavedSearch: SavedSearch = {
        query: searchQuery,
        results: searchResults,
        summary: summary,
      };
      const updatedSavedSearches = [...savedSearches, newSavedSearch];
      setSavedSearches(updatedSavedSearches);
      localStorage.setItem(
        "savedSearches",
        JSON.stringify(updatedSavedSearches)
      );
      setIsSaved(true);
    }
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    setSearchResults(savedSearch.results);
    setSummary(savedSearch.summary);
    setIsSidebarOpen(false);
  };

  const deleteSavedSearch = (index: number) => {
    const updatedSavedSearches = savedSearches.filter((_, i) => i !== index);
    setSavedSearches(updatedSavedSearches);
    localStorage.setItem("savedSearches", JSON.stringify(updatedSavedSearches));
    setShowDeleteConfirm(null);
  };

  const resetToInitialState = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSummary(null);
    setIsLoading(false);
    setIsSaved(false);
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 flex">
      {/* Sidebar and toggle button container */}
      <div className="relative">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-72 bg-white shadow-lg transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out z-20 overflow-y-auto`}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
              Saved Searches
            </h2>
            {savedSearches.map((savedSearch, index) => (
              <div
                key={index}
                className="mb-4 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow duration-200 relative group"
              >
                <div
                  className="cursor-pointer p-4"
                  onClick={() => loadSavedSearch(savedSearch)}
                >
                  <p className="font-semibold text-gray-800 mb-1 pr-8">
                    {savedSearch.query}
                  </p>
                </div>
                <button
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => setShowDeleteConfirm(index)}
                >
                  <svg
                    className="w-5 h-5 text-gray-500 hover:text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showDeleteConfirm === index && (
                  <div className="absolute right-0 top-0 mt-8 w-48 bg-white rounded-md shadow-lg z-10 p-2">
                    <p className="text-sm mb-2">Delete this saved search?</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                        onClick={() => deleteSavedSearch(index)}
                      >
                        Delete
                      </button>
                      <button
                        className="px-3 py-1 text-xs bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors duration-200"
                        onClick={() => setShowDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar toggle button */}
        <button
          className={`fixed top-4 z-30 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg transition-all duration-300 ease-in-out flex items-center space-x-2 ${
            isSidebarOpen ? "left-[304px]" : "left-4"
          }`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <>
              <span>←</span>
              <span>Saved</span>
            </>
          ) : (
            <>
              <span>Saved</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>

      {/* Main content wrapper */}
      <div className="flex-1 transition-all duration-300 ease-in-out flex justify-center">
        {/* Content container */}
        <div
          className={`w-full max-w-4xl transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-64" : ""
          }`}
        >
          <main className="p-8">
            <div className="mb-12 text-center">
              <h1
                className="text-6xl font-extrabold text-blue-600 mb-2 tracking-tight cursor-pointer"
                onClick={resetToInitialState}
              >
                Perplexi<span className="text-purple-600">Clone</span>
              </h1>
              <p className="text-xl text-gray-600 font-light">
                AI-Powered Search and Summarization
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anything..."
                className="flex-grow px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </form>

            {searchResults && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2 border-gray-300">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    Sources
                  </span>
                </h2>
                <div className="flex overflow-x-auto pb-4 gap-3">
                  {searchResults.results.map((result: any, index: number) => {
                    const siteUrl = new URL(result.url);
                    const siteName = siteUrl.hostname.replace("www.", "");
                    const publishedDate = result.publishedDate
                      ? new Date(result.publishedDate).toLocaleDateString()
                      : "Date not available";

                    return (
                      <a
                        key={index}
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-72 bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 hover:border-blue-300"
                      >
                        <h3 className="font-bold mb-1 text-base text-blue-600 hover:text-blue-800 transition-colors duration-200 line-clamp-2">
                          {result.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {siteName} • {publishedDate}
                        </p>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                          {result.snippet}
                        </p>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {summary && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 border-b pb-2 border-gray-300">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                      Answer
                    </span>
                  </h2>
                  <button
                    onClick={saveSearch}
                    disabled={isSaved}
                    className={`
                      relative overflow-hidden px-6 py-2 rounded-md
                      transition-all duration-300 ease-in-out
                      ${
                        isSaved
                          ? "bg-green-500 text-white cursor-default transform scale-105"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md
                      min-w-[100px] transform
                    `}
                  >
                    <span
                      className={`transition-opacity duration-300 ${
                        isSaved ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      Save
                    </span>
                    <span
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                        isSaved ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Saved</span>
                    </span>
                  </button>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <div className="space-y-6">
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => (
                          <h3
                            className="text-xl font-semibold mb-2 text-blue-700"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h4
                            className="text-lg font-semibold mb-2 text-blue-600"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p
                            className="mb-2 text-gray-700 leading-relaxed"
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong
                            className="font-bold text-gray-900"
                            {...props}
                          />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="italic text-gray-800" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 mb-2" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-5 mb-2" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="mb-1" {...props} />
                        ),
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center items-center mt-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            )}

            <footer className="mt-12 text-center text-gray-600 text-sm">
              <p>
                Created by{" "}
                <a
                  href="https://www.kevinbzhu.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Kevin Zhu
                </a>{" "}
                👋
              </p>
              <p className="mt-2">
                Inspired by{" "}
                <a
                  href="https://x.com/mckaywrigley/status/1831429674582602198"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  this Twitter post
                </a>
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
