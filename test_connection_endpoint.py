@router.get("/connections/{connection_id}/test")
async def test_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test a database connection to verify it's working."""
    try:
        # Find the connection
        db_connection = db.query(Database).filter(Database.id == connection_id).first()
        
        if not db_connection:
            raise HTTPException(status_code=404, detail="Database connection not found")
        
        # Check permission
        if db_connection.user_id != current_user.id and current_user.role.name not in ["admin", "developer", "analyst"]:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to test this connection"
            )
        
        # Try to connect to the database to test the connection
        # Different handling based on database type
        if db_connection.db_type == "postgresql" or db_connection.db_type == "mysql":
            # For SQL databases
            engine = None
            try:
                # Create a temporary engine
                engine = create_engine(db_connection.connection_string)
                
                # Try to connect
                with engine.connect() as conn:
                    # Just running a simple query to verify connection
                    result = conn.execute(text("SELECT 1")).first()
                    
                return {"success": True, "message": "Connection successful"}
            except Exception as e:
                logger.error(f"Error testing connection: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to database: {str(e)}"
                )
            finally:
                if engine:
                    engine.dispose()
        
        elif db_connection.db_type == "mongodb":
            # For MongoDB connections
            try:
                from pymongo import MongoClient
                
                # Create a temporary client
                client = MongoClient(db_connection.connection_string, serverSelectionTimeoutMS=5000)
                
                # Force a connection to verify
                client.admin.command('ping')
                
                return {"success": True, "message": "Connection successful"}
            except Exception as e:
                logger.error(f"Error testing MongoDB connection: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to connect to MongoDB: {str(e)}"
                )
            finally:
                if 'client' in locals():
                    client.close()
        
        else:
            # Unsupported database type
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported database type: {db_connection.db_type}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in test_connection: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 