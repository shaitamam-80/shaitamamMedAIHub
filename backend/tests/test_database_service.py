"""
MedAI Hub - Database Service Tests
Tests for Supabase database operations with mocked client.
These tests verify the service methods work correctly with a mocked Supabase client.
"""

import pytest
from unittest.mock import MagicMock
from uuid import uuid4


class TestDatabaseServiceProjects:
    """Tests for project-related database operations"""

    @pytest.mark.asyncio
    async def test_create_project(self, mock_supabase_client, sample_project_data):
        """Test creating a project"""
        mock_supabase_client.execute.return_value = MagicMock(data=[sample_project_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.create_project({"name": "Test Project", "framework_type": "PICO"})

        mock_supabase_client.table.assert_called_with("projects")
        assert result is not None

    @pytest.mark.asyncio
    async def test_get_project_found(self, mock_supabase_client, sample_project_data, sample_project_id):
        """Test getting an existing project"""
        mock_supabase_client.execute.return_value = MagicMock(data=[sample_project_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.get_project(sample_project_id)

        mock_supabase_client.table.assert_called_with("projects")
        assert result == sample_project_data

    @pytest.mark.asyncio
    async def test_get_project_not_found(self, mock_supabase_client, sample_project_id):
        """Test getting a non-existent project"""
        mock_supabase_client.execute.return_value = MagicMock(data=[])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.get_project(sample_project_id)

        assert result is None

    @pytest.mark.asyncio
    async def test_update_project(self, mock_supabase_client, sample_project_data, sample_project_id):
        """Test updating a project"""
        updated_data = {**sample_project_data, "name": "Updated Name"}
        mock_supabase_client.execute.return_value = MagicMock(data=[updated_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.update_project(sample_project_id, {"name": "Updated Name"})

        mock_supabase_client.table.assert_called_with("projects")
        assert result["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_list_projects(self, mock_supabase_client, sample_project_data):
        """Test listing projects"""
        mock_supabase_client.execute.return_value = MagicMock(data=[sample_project_data, sample_project_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.list_projects()

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_list_projects_empty(self, mock_supabase_client):
        """Test listing projects when none exist"""
        mock_supabase_client.execute.return_value = MagicMock(data=[])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.list_projects()

        assert result == []
