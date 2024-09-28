"use client";

import { useState, useEffect } from "react";
import { searchExaContents } from "./actions/exa-actions";
import { getChatCompletion } from "./actions/openai-actions";
import ReactMarkdown from "react-markdown";

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  score: number;
  publishedDate?: string;
}

interface SearchResponse {
  results: SearchResult[];
}

interface SavedSearch {
  query: string;
  results: SearchResponse;
  summary: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
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
    setIsSaved(false);
    try {
      const searchResults = await searchExaContents(searchQuery);
      setSearchResults(searchResults as unknown as SearchResponse);

      const topResults = searchResults.results
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5);

      const combinedText = topResults.map((result) => result.text).join("\n\n");

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
      if ("content" in summaryResult) {
        setSummary(summaryResult.content);
      } else {
        console.error("Error generating summary:", summaryResult.error);
      }
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
    <div className="min-h-screen font-sans bg-gradient-to-br from-[#acb6e5] to-[#86fde8] flex flex-col lg:flex-row">
      {/* Sidebar and toggle button container */}
      <div className="relative lg:flex-shrink-0">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-full sm:w-80 lg:w-72 bg-white shadow-lg transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out z-20 overflow-y-auto`}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-black border-b pb-2">
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
                  <p className="font-semibold text-[#2d3748] mb-1 pr-8">
                    {savedSearch.query}
                  </p>
                </div>
                <button
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => setShowDeleteConfirm(index)}
                >
                  <svg
                    className="w-5 h-5 text-[#2d3748] hover:text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showDeleteConfirm === index && (
                  <div className="absolute right-0 top-0 mt-8 w-32 bg-white rounded-md shadow-lg z-10 p-2 flex flex-col space-y-1">
                    <button
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                      onClick={() => deleteSavedSearch(index)}
                    >
                      Delete
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar toggle button */}
        <button
          className={`fixed top-4 z-30 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg transition-all duration-300 ease-in-out flex items-center space-x-2 ${
            isSidebarOpen
              ? "left-[320px] sm:left-[336px] lg:left-[304px]"
              : "left-4"
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
      <div className="flex-1 transition-all duration-300 ease-in-out flex justify-center p-4 sm:p-6 lg:p-8">
        {/* Content container */}
        <div
          className={`w-full max-w-4xl transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "lg:ml-72" : ""
          }`}
        >
          <main>
            <div className="mb-8 sm:mb-12 text-center">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-2 tracking-tight cursor-pointer text-black"
                onClick={resetToInitialState}
              >
                Perplexi<span className="text-gray-800">Clone</span>
              </h1>
              <p className="text-lg sm:text-xl text-black font-light">
                AI-Powered Search and Summarization
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 mb-8"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anything..."
                className="flex-grow px-4 py-3 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-black placeholder-gray-400 bg-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </form>

            {searchResults && (
              <div className="mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black border-b pb-2 border-gray-300">
                  Sources
                </h2>
                <div className="flex flex-col sm:flex-row sm:overflow-x-auto pb-4 gap-3">
                  {searchResults.results.map(
                    (result: SearchResult, index: number) => {
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
                          className="flex-shrink-0 w-full sm:w-72 bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-[#4a5568] hover:border-[#2d3748] mb-3 sm:mb-0"
                        >
                          <h3 className="font-bold mb-1 text-base text-[#2d3748] hover:text-[#4a5568] transition-colors duration-200 line-clamp-2">
                            {result.title}
                          </h3>
                          <p className="text-xs text-[#4a5568] mb-1">
                            {siteName} • {publishedDate}
                          </p>
                          <p className="text-xs text-[#718096] mb-2 line-clamp-3">
                            {result.snippet}
                          </p>
                        </a>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {summary && (
              <div className="mb-8 sm:mb-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-black border-b pb-2 border-gray-300 mb-2 sm:mb-0">
                    Answer
                  </h2>
                  <button
                    onClick={saveSearch}
                    disabled={isSaved}
                    className={`
                      relative overflow-hidden px-4 sm:px-6 py-2 rounded-md
                      transition-all duration-300 ease-in-out
                      ${
                        isSaved
                          ? "bg-green-500 text-white cursor-default transform scale-105"
                          : "bg-black text-white hover:bg-gray-800"
                      }
                      focus:outline-none focus:ring-2 focus:ring-black shadow-md
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
                <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg border border-gray-300">
                  <div className="space-y-4 sm:space-y-6">
                    <ReactMarkdown
                      components={{
                        h1: ({ ...props }) => (
                          <h3
                            className="text-lg sm:text-xl font-semibold mb-2 text-black"
                            {...props}
                          />
                        ),
                        h2: ({ ...props }) => (
                          <h4
                            className="text-base sm:text-lg font-semibold mb-2 text-black"
                            {...props}
                          />
                        ),
                        p: ({ ...props }) => (
                          <p
                            className="mb-2 text-sm sm:text-base text-gray-800 leading-relaxed"
                            {...props}
                          />
                        ),
                        strong: ({ ...props }) => (
                          <strong className="font-bold text-black" {...props} />
                        ),
                        em: ({ ...props }) => (
                          <em className="italic text-gray-800" {...props} />
                        ),
                        ul: ({ ...props }) => (
                          <ul
                            className="list-disc pl-5 mb-2 text-sm sm:text-base text-gray-800"
                            {...props}
                          />
                        ),
                        ol: ({ ...props }) => (
                          <ol
                            className="list-decimal pl-5 mb-2 text-sm sm:text-base text-gray-800"
                            {...props}
                          />
                        ),
                        li: ({ ...props }) => (
                          <li className="mb-1 text-gray-800" {...props} />
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
              <div className="flex justify-center items-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#4a5568]"></div>
              </div>
            )}

            <footer className="mt-8 sm:mt-12 text-center text-[#4a5568] text-xs sm:text-sm">
              <p>
                Created by{" "}
                <a
                  href="https://www.kevinbzhu.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2d3748] hover:text-[#4a5568] underline"
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
                  className="text-[#2d3748] hover:text-[#4a5568] underline"
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
