import { useState, useEffect } from 'react';
import { GetJourneyBoards } from '@requests/journey';
import { JourneyBoard } from '@models/journey';

let cachedBoards: JourneyBoard[] | null = null;
let fetchPromise: Promise<JourneyBoard[]> | null = null;

// Shared function to get journey boards (with caching)
export const getJourneyBoardsCached = async (): Promise<JourneyBoard[]> => {
  // If we already have cached data, return it
  if (cachedBoards) {
    return cachedBoards;
  }

  // If a fetch is already in progress, wait for it
  if (fetchPromise) {
    return fetchPromise;
  }

  // Otherwise, fetch the data
  fetchPromise = GetJourneyBoards();
  try {
    cachedBoards = await fetchPromise;
    fetchPromise = null;
    return cachedBoards;
  } catch (error) {
    fetchPromise = null;
    throw error;
  }
};

export const useJourneyBoards = () => {
  const [boards, setBoards] = useState<JourneyBoard[]>(cachedBoards || []);
  const [isLoading, setIsLoading] = useState(!cachedBoards);

  useEffect(() => {
    // If we already have cached data, use it
    if (cachedBoards) {
      setBoards(cachedBoards);
      setIsLoading(false);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise) {
      fetchPromise.then((data) => {
        setBoards(data);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
      return;
    }

    // Otherwise, fetch the data
    setIsLoading(true);
    getJourneyBoardsCached()
      .then((data) => {
        setBoards(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  return { boards, isLoading };
};

