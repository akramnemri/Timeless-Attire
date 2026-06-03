import React, { useState, useEffect } from "react";
import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";

const CategorySideBar = ({ selectedCategory, setSelectedCategory }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/categories/");
                if (!response.ok) throw new Error("Failed to fetch categories");
                const data = await response.json();
                setCategories(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) return <Typography>Loading categories...</Typography>;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Box sx={{ width: 250, p: 2, bgcolor: "background.paper" }}>
            <Typography variant="h6" gutterBottom>
                Categories
            </Typography>
            <List>
                <ListItem
                    button
                    selected={selectedCategory === null}
                    onClick={() => setSelectedCategory(null)}
                >
                    <ListItemText primary="All Categories" />
                </ListItem>
                {categories.map((category) => (
                    <ListItem
                        button
                        key={category.id}
                        selected={selectedCategory === category.id}
                        onClick={() => setSelectedCategory(category.id)}
                    >
                        <ListItemText primary={category.name} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default CategorySideBar;