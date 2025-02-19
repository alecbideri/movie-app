import {useEffect, useState, useCallback} from 'react'
import Search from "./components/search.jsx";
import Spinner from "./components/spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
    }
}

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [movieList, setMovieList] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error('Failed to fetch movies.');
            }

            const data = await response.json();
            console.log(data);

            if(data.response === 'false'){
                setErrorMessage(data.Error || 'failed to fetch movies.');
            }

            setMovieList(data.results || []);
            if(query && data.results.length > 0) {
                await updateSearchCount(query ,data.results[0]);
            }

        } catch (error) {
            console.error(`Error fetching movies: ${error}`);
            setErrorMessage('Something went wrong please try again later.');
            setMovieList([]);
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async (query = '') => {
        try {
         const movies = await getTrendingMovies();
         setTrendingMovies(movies);
        }catch(error){
            console.error(`Error fetching trending movies : ${error}`);
        }
    }

    // Wrap fetchMovies in useCallback to prevent recreation on each render
    const debouncedFetch = useCallback((query) => {
        console.log("Debounced search for:", query);
        fetchMovies(query);
    }, []);

    // Use useDebounce with the callback
    useDebounce(
        () => {
            if (searchTerm !== undefined) {
                debouncedFetch(searchTerm);
            }
        },
        500,
        [searchTerm]
    );

    // Initial load of all movies and tke care of the search trends
    useEffect(() => {
        fetchMovies();
    }, []);

    // for loading trending movies

    useEffect(() => {
        loadTrendingMovies();
    }, []);


    return (
        <main>
            <div className='pattern'/>
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner"/>
                    <h1>Find <span className='text-gradient'>Movies</span> You will enjoy without the hassle</h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className= 'trending'>
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie , index)=>
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            )}
                        </ul>
                    </section>
                )}

                <section className='all-movies'>

                    <h2>All movies</h2>
                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className='text-red-500'>{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.length > 0 ? (
                                movieList.map((movie) => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))
                            ) : (
                                <p className='text-white text-3xl'>No movies found for {searchTerm}.</p>
                            )}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}

export default App