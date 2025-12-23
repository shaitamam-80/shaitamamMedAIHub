"""
MedAI Hub - Database Service Tests
Tests for Supabase database operations with mocked client
These tests verify the service methods work correctly with a mocked Supabase client.
"""

from unittest.mock import MagicMock
from uuid import uuid4

import pytest


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
    async def test_get_project_found(
        self, mock_supabase_client, sample_project_data, sample_project_id
    ):
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
    async def test_update_project(
        self, mock_supabase_client, sample_project_data, sample_project_id
    ):
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
        mock_supabase_client.execute.return_value = MagicMock(
            data=[sample_project_data, sample_project_data]
        )

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


class TestDatabaseServiceFiles:
    """Tests for file-related database operations"""

    @pytest.mark.asyncio
    async def test_create_file(self, mock_supabase_client, sample_project_id):
        """Test creating a file record"""
        file_data = {
            "id": str(uuid4()),
            "project_id": str(sample_project_id),
            "filename": "test.txt",
            "file_type": "medline",
            "status": "uploaded",
        }
        mock_supabase_client.execute.return_value = MagicMock(data=[file_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.create_file(file_data)

        mock_supabase_client.table.assert_called_with("files")
        assert result["filename"] == "test.txt"

    @pytest.mark.asyncio
    async def test_get_file(self, mock_supabase_client):
        """Test getting a file record"""
        file_id = uuid4()
        file_data = {"id": str(file_id), "filename": "test.txt"}
        mock_supabase_client.execute.return_value = MagicMock(data=[file_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.get_file(file_id)

        assert result["filename"] == "test.txt"

    @pytest.mark.asyncio
    async def test_get_files_by_project(self, mock_supabase_client, sample_project_id):
        """Test getting files for a project"""
        files = [
            {"id": str(uuid4()), "filename": "file1.txt"},
            {"id": str(uuid4()), "filename": "file2.txt"},
        ]
        mock_supabase_client.execute.return_value = MagicMock(data=files)

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.get_files_by_project(sample_project_id)

        assert len(result) == 2


class TestDatabaseServiceChatMessages:
    """Tests for chat message database operations"""

    @pytest.mark.asyncio
    async def test_save_message(self, mock_supabase_client, sample_project_id):
        """Test saving a chat message"""
        message_data = {
            "id": str(uuid4()),
            "project_id": str(sample_project_id),
            "role": "user",
            "content": "Test message",
        }
        mock_supabase_client.execute.return_value = MagicMock(data=[message_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.save_message(message_data)

        mock_supabase_client.table.assert_called_with("chat_messages")
        assert result["content"] == "Test message"

    @pytest.mark.asyncio
    async def test_get_conversation(self, mock_supabase_client, sample_project_id):
        """Test getting conversation history"""
        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ]
        mock_supabase_client.execute.return_value = MagicMock(data=messages)

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.get_conversation(sample_project_id)

        assert len(result) == 2
        assert result[0]["role"] == "user"

    @pytest.mark.asyncio
    async def test_clear_conversation(self, mock_supabase_client, sample_project_id):
        """Test clearing conversation history"""
        mock_supabase_client.execute.return_value = MagicMock(data=[])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.clear_conversation(sample_project_id)

        assert result is True


class TestDatabaseServiceAbstracts:
    """Tests for abstract database operations"""

    @pytest.mark.asyncio
    async def test_create_abstract(self, mock_supabase_client, sample_abstract_data):
        """Test creating an abstract record"""
        mock_supabase_client.execute.return_value = MagicMock(data=[sample_abstract_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.create_abstract(sample_abstract_data)

        mock_supabase_client.table.assert_called_with("abstracts")
        assert result["pmid"] == sample_abstract_data["pmid"]

    @pytest.mark.asyncio
    async def test_bulk_create_abstracts(self, mock_supabase_client, sample_abstract_data):
        """Test bulk creating abstracts"""
        abstracts = [sample_abstract_data, {**sample_abstract_data, "pmid": "99999999"}]
        mock_supabase_client.execute.return_value = MagicMock(data=abstracts)

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.bulk_create_abstracts(abstracts)

        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_get_abstracts_by_project(
        self, mock_supabase_client, sample_project_id, sample_abstract_data
    ):
        """Test getting abstracts for a project"""
        mock_supabase_client.execute.return_value = MagicMock(data=[sample_abstract_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.get_abstracts_by_project(sample_project_id)

        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_update_abstract_decision(self, mock_supabase_client, sample_abstract_data):
        """Test updating abstract screening decision"""
        abstract_id = uuid4()
        updated_data = {**sample_abstract_data, "status": "include", "ai_decision": "include"}
        mock_supabase_client.execute.return_value = MagicMock(data=[updated_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.update_abstract_decision(
            abstract_id, {"status": "include", "ai_decision": "include"}
        )

        assert result["status"] == "include"


class TestDatabaseServiceAnalysisRuns:
    """Tests for analysis run database operations"""

    @pytest.mark.asyncio
    async def test_create_analysis_run(self, mock_supabase_client, sample_project_id):
        """Test creating an analysis run"""
        run_data = {
            "id": str(uuid4()),
            "project_id": str(sample_project_id),
            "status": "running",
            "total_abstracts": 100,
        }
        mock_supabase_client.execute.return_value = MagicMock(data=[run_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.create_analysis_run(run_data)

        mock_supabase_client.table.assert_called_with("analysis_runs")
        assert result["status"] == "running"

    @pytest.mark.asyncio
    async def test_update_analysis_run(self, mock_supabase_client):
        """Test updating an analysis run"""
        run_id = uuid4()
        updated_data = {"status": "completed", "processed_abstracts": 100}
        mock_supabase_client.execute.return_value = MagicMock(data=[updated_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.update_analysis_run(run_id, updated_data)

        assert result["status"] == "completed"


class TestDatabaseServiceQueryStrings:
    """Tests for query string database operations"""

    @pytest.mark.asyncio
    async def test_save_query_string(self, mock_supabase_client, sample_project_id):
        """Test saving a generated query string"""
        query_data = {
            "id": str(uuid4()),
            "project_id": str(sample_project_id),
            "query_type": "broad",
            "query_string": "(diabetes) AND (metformin)",
        }
        mock_supabase_client.execute.return_value = MagicMock(data=[query_data])

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.save_query_string(query_data)

        mock_supabase_client.table.assert_called_with("query_strings")
        assert result["query_type"] == "broad"

    @pytest.mark.asyncio
    async def test_get_query_strings_by_project(self, mock_supabase_client, sample_project_id):
        """Test getting query history for a project"""
        queries = [
            {"query_type": "broad", "query_string": "(diabetes)"},
            {"query_type": "focused", "query_string": "(diabetes[MeSH])"},
        ]
        mock_supabase_client.execute.return_value = MagicMock(data=queries)

        from app.services.database import DatabaseService

        db = DatabaseService.__new__(DatabaseService)
        db._client = mock_supabase_client

        result = await db.get_query_strings_by_project(sample_project_id)

        assert len(result) == 2
